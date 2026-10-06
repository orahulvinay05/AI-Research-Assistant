import os
import json
import math
import urllib.request
import urllib.error
from pathlib import Path
from typing import Optional

import fitz
from dotenv import load_dotenv

from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter


# ============================================================
# ENVIRONMENT
# ============================================================

BASE_DIR = Path(__file__).resolve().parent

load_dotenv(BASE_DIR / ".env")

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

if not GOOGLE_API_KEY:
    raise RuntimeError(
        "GOOGLE_API_KEY is missing. "
        "Create backend/.env and add your Gemini API key."
    )


# ============================================================
# DIRECTORIES
# ============================================================

UPLOAD_FOLDER = BASE_DIR / "uploads"

VECTOR_FOLDER = BASE_DIR / "vector_data"

VECTOR_FOLDER.mkdir(
    parents=True,
    exist_ok=True
)

UPLOAD_FOLDER.mkdir(
    parents=True,
    exist_ok=True
)


# ============================================================
# LOCAL VECTOR DATABASE
# ============================================================

VECTOR_FILE = VECTOR_FOLDER / "vectors.json"


def load_vectors():
    """
    Load locally stored paper chunks and embeddings.
    """

    if not VECTOR_FILE.exists():
        return []

    try:
        with open(
            VECTOR_FILE,
            "r",
            encoding="utf-8"
        ) as file:

            data = json.load(file)

            if isinstance(data, list):
                return data

    except Exception as exc:

        print(
            f"Warning: could not load vectors: {exc}"
        )

    return []


def save_vectors(vectors):
    """
    Save vectors to local JSON storage.
    """

    temporary_file = VECTOR_FILE.with_suffix(
        ".tmp"
    )

    with open(
        temporary_file,
        "w",
        encoding="utf-8"
    ) as file:

        json.dump(
            vectors,
            file,
            ensure_ascii=False
        )

    temporary_file.replace(
        VECTOR_FILE
    )


# ============================================================
# GEMINI API CONFIGURATION
# ============================================================

GENERATION_MODEL = "gemini-2.5-flash"

EMBEDDING_MODEL = "gemini-embedding-001"

GENERATION_URL = (
    "https://generativelanguage.googleapis.com/"
    f"v1beta/models/{GENERATION_MODEL}:generateContent"
)

EMBEDDING_URL = (
    "https://generativelanguage.googleapis.com/"
    f"v1beta/models/{EMBEDDING_MODEL}:embedContent"
)


# ============================================================
# HTTP JSON HELPER
# ============================================================

def post_json(
    url,
    payload,
    timeout=120
):
    """
    Send a JSON POST request using Python's standard library.

    This avoids grpcio completely.
    """

    data = json.dumps(
        payload
    ).encode("utf-8")

    request = urllib.request.Request(
        url,
        data=data,
        headers={
            "Content-Type": "application/json"
        },
        method="POST",
    )

    try:

        with urllib.request.urlopen(
            request,
            timeout=timeout
        ) as response:

            response_text = response.read().decode(
                "utf-8"
            )

            return json.loads(
                response_text
            )

    except urllib.error.HTTPError as exc:

        error_body = exc.read().decode(
            "utf-8",
            errors="replace"
        )

        raise RuntimeError(
            f"Google API error {exc.code}: "
            f"{error_body}"
        ) from exc

    except urllib.error.URLError as exc:

        raise RuntimeError(
            "Could not connect to Google API: "
            f"{exc.reason}"
        ) from exc


# ============================================================
# GEMINI TEXT GENERATION
# ============================================================

def generate_text(prompt):
    """
    Generate text using Gemini REST API.
    """

    url = (
        f"{GENERATION_URL}"
        f"?key={GOOGLE_API_KEY}"
    )

    payload = {
        "contents": [
            {
                "parts": [
                    {
                        "text": prompt
                    }
                ]
            }
        ],
        "generationConfig": {
            "temperature": 0
        }
    }

    response = post_json(
        url,
        payload
    )

    try:

        candidates = response.get(
            "candidates",
            []
        )

        if not candidates:

            raise RuntimeError(
                "Gemini returned no candidates."
            )

        parts = (
            candidates[0]
            .get("content", {})
            .get("parts", [])
        )

        text_parts = []

        for part in parts:

            if "text" in part:

                text_parts.append(
                    str(part["text"])
                )

        result = "\n".join(
            text_parts
        ).strip()

        if not result:

            raise RuntimeError(
                "Gemini returned an empty response."
            )

        return result

    except Exception as exc:

        if isinstance(
            exc,
            RuntimeError
        ):
            raise

        raise RuntimeError(
            "Unexpected Gemini response format."
        ) from exc


# ============================================================
# GEMINI EMBEDDINGS
# ============================================================

def create_embedding(text):
    """
    Generate a vector embedding using Gemini's
    embedding REST API.

    No PyTorch.
    No Sentence Transformers.
    No gRPC.
    """

    url = (
        f"{EMBEDDING_URL}"
        f"?key={GOOGLE_API_KEY}"
    )

    payload = {
        "content": {
            "parts": [
                {
                    "text": text
                }
            ]
        }
    }

    response = post_json(
        url,
        payload
    )

    embedding = response.get(
        "embedding",
        {}
    ).get(
        "values"
    )

    if not embedding:

        raise RuntimeError(
            "Gemini returned no embedding."
        )

    return embedding


# ============================================================
# COSINE SIMILARITY
# ============================================================

def cosine_similarity(
    vector_a,
    vector_b
):
    """
    Calculate cosine similarity between
    two vectors.
    """

    if not vector_a or not vector_b:
        return 0.0

    if len(vector_a) != len(vector_b):
        return 0.0

    dot_product = 0.0

    magnitude_a = 0.0
    magnitude_b = 0.0

    for a, b in zip(
        vector_a,
        vector_b
    ):

        dot_product += a * b

        magnitude_a += a * a

        magnitude_b += b * b

    if magnitude_a == 0 or magnitude_b == 0:
        return 0.0

    return (
        dot_product
        /
        (
            math.sqrt(magnitude_a)
            *
            math.sqrt(magnitude_b)
        )
    )


# ============================================================
# SEARCH VECTOR DATABASE
# ============================================================

def similarity_search(
    query,
    filename=None,
    k=5
):
    """
    Find the most relevant chunks using cosine similarity.
    """

    vectors = load_vectors()

    if filename:

        vectors = [
            item
            for item in vectors
            if item.get("source") == filename
        ]

    if not vectors:
        return []

    query_embedding = create_embedding(
        query
    )

    scored = []

    for item in vectors:

        embedding = item.get(
            "embedding",
            []
        )

        score = cosine_similarity(
            query_embedding,
            embedding
        )

        scored.append(
            {
                "score": score,
                "item": item
            }
        )

    scored.sort(
        key=lambda item: item["score"],
        reverse=True
    )

    results = []

    for item in scored[:k]:

        result = dict(
            item["item"]
        )

        result["score"] = item["score"]

        results.append(
            result
        )

    return results


# ============================================================
# PDF TEXT EXTRACTION
# ============================================================

def extract_text_from_pdf(
    pdf_path
):
    """
    Extract text from every PDF page.
    """

    pages = []

    pdf_path = Path(
        pdf_path
    )

    document = fitz.open(
        pdf_path
    )

    try:

        for page_index, page in enumerate(
            document
        ):

            text = page.get_text(
                "text"
            ).strip()

            if text:

                pages.append(
                    {
                        "page": page_index + 1,
                        "text": text
                    }
                )

    finally:

        document.close()

    return pages


# ============================================================
# CREATE CHUNKS
# ============================================================

def create_chunks(
    pages,
    filename
):
    """
    Split paper text into overlapping chunks.
    """

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
        separators=[
            "\n\n",
            "\n",
            ". ",
            " ",
            ""
        ]
    )

    documents = []

    for page_data in pages:

        page_number = page_data[
            "page"
        ]

        text = page_data[
            "text"
        ]

        chunks = splitter.split_text(
            text
        )

        for chunk in chunks:

            if not chunk.strip():
                continue

            documents.append(
                Document(
                    page_content=chunk,
                    metadata={
                        "source": filename,
                        "page": page_number
                    }
                )
            )

    return documents


# ============================================================
# DELETE PAPER VECTORS
# ============================================================

def delete_paper_vectors(
    filename
):
    """
    Delete all stored chunks for a paper.
    """

    vectors = load_vectors()

    filtered_vectors = [
        item
        for item in vectors
        if item.get("source") != filename
    ]

    save_vectors(
        filtered_vectors
    )


# ============================================================
# PROCESS PDF
# ============================================================

def process_pdf(
    pdf_path
):
    """
    Process PDF into local vector storage.
    """

    pdf_path = Path(
        pdf_path
    )

    filename = pdf_path.name

    print(
        f"Processing PDF: {filename}"
    )

    pages = extract_text_from_pdf(
        pdf_path
    )

    if not pages:

        raise ValueError(
            "No readable text was found in the PDF."
        )

    documents = create_chunks(
        pages,
        filename
    )

    if not documents:

        raise ValueError(
            "Could not create chunks from the PDF."
        )

    # Remove old vectors.
    delete_paper_vectors(
        filename
    )

    vectors = load_vectors()

    total = len(documents)

    for index, document in enumerate(
        documents
    ):

        print(
            f"Creating embedding "
            f"{index + 1}/{total}..."
        )

        embedding = create_embedding(
            document.page_content
        )

        vectors.append(
            {
                "id": (
                    f"{filename}_{index}"
                ),
                "source": filename,
                "page": document.metadata[
                    "page"
                ],
                "text": document.page_content,
                "embedding": embedding
            }
        )

    save_vectors(
        vectors
    )

    print(
        f"Finished processing {filename}"
    )

    return {
        "filename": filename,
        "pages": len(pages),
        "chunks": len(documents)
    }


# ============================================================
# ASK QUESTION
# ============================================================

def ask_question(
    question,
    filename: Optional[str] = None
):
    """
    Answer a question using RAG.
    """

    question = question.strip()

    if not question:

        raise ValueError(
            "Question cannot be empty."
        )

    results = similarity_search(
        question,
        filename=filename,
        k=5
    )

    if not results:

        return {
            "answer": (
                "I could not find relevant "
                "information in the uploaded "
                "research papers."
            ),
            "sources": 0,
            "source_details": []
        }

    context_parts = []

    source_details = []

    seen_sources = set()

    for result in results:

        source = result.get(
            "source",
            "Unknown"
        )

        page = result.get(
            "page",
            "Unknown"
        )

        text = result.get(
            "text",
            ""
        )

        context_parts.append(
            f"[Source: {source}, "
            f"Page: {page}]\n{text}"
        )

        source_key = (
            f"{source}:{page}"
        )

        if source_key not in seen_sources:

            source_details.append(
                {
                    "filename": source,
                    "page": page
                }
            )

            seen_sources.add(
                source_key
            )

    context = "\n\n".join(
        context_parts
    )

    prompt = f"""
You are ResearchAI, an academic research assistant.

Answer the user's question using ONLY the
provided research-paper context.

Rules:

1. Do not invent facts.
2. Do not use unsupported information.
3. If the context is insufficient, say so.
4. Give a clear academic answer.
5. Mention source pages where appropriate.
6. Distinguish inference from information explicitly
   stated in the paper.

Research-paper context:

{context}

User question:

{question}

Answer:
"""

    answer = generate_text(
        prompt
    )

    return {
        "answer": answer,
        "sources": len(
            source_details
        ),
        "source_details": source_details
    }


# ============================================================
# GET PAPER DOCUMENTS
# ============================================================

def get_paper_documents(
    filename
):
    """
    Return all chunks belonging to a paper.
    """

    vectors = load_vectors()

    documents = []

    for item in vectors:

        if item.get(
            "source"
        ) != filename:

            continue

        documents.append(
            {
                "text": item.get(
                    "text",
                    ""
                ),
                "page": item.get(
                    "page",
                    0
                ),
                "source": item.get(
                    "source",
                    filename
                )
            }
        )

    documents.sort(
        key=lambda item: (
            item["page"],
            item["text"]
        )
    )

    return documents


# ============================================================
# SUMMARIZE PAPER
# ============================================================

def summarize_paper(
    filename
):
    """
    Generate structured paper summary.
    """

    documents = get_paper_documents(
        filename
    )

    if not documents:

        raise ValueError(
            "No indexed content found "
            "for this paper."
        )

    batch_size = 8

    batches = []

    for start in range(
        0,
        len(documents),
        batch_size
    ):

        batches.append(
            documents[
                start:start + batch_size
            ]
        )

    intermediate_summaries = []

    for batch in batches:

        context = "\n\n".join(
            f"[Page {item['page']}]\n"
            f"{item['text']}"
            for item in batch
        )

        prompt = f"""
You are analyzing part of an academic research paper.

Summarize ONLY the supplied content.

Do not invent information.

Focus on:

- research objective
- methodology
- findings
- contributions
- limitations
- future work

Paper content:

{context}
"""

        summary = generate_text(
            prompt
        )

        intermediate_summaries.append(
            summary[:4000]
        )

    combined_summary = "\n\n".join(
        intermediate_summaries
    )

    final_prompt = f"""
You are an academic research assistant.

Create a structured summary using ONLY
the supplied research-paper information.

If something is not specified, write:

"Not specified in the paper."

Return:

# Research Paper Summary

## 1. Executive Summary

## 2. Research Objective

## 3. Methodology

## 4. Key Findings

## 5. Main Contributions

## 6. Limitations

## 7. Future Work

## 8. Keywords

Paper information:

{combined_summary}
"""

    final_summary = generate_text(
        final_prompt
    )

    unique_pages = sorted(
        {
            item["page"]
            for item in documents
            if item["page"]
        }
    )

    return {
        "filename": filename,
        "summary": final_summary,
        "pages": len(unique_pages),
        "chunks": len(documents)
    }


# ============================================================
# COMPARE PAPERS
# ============================================================

def compare_papers(
    filename1,
    filename2
):
    """
    Compare two papers.
    """

    documents1 = get_paper_documents(
        filename1
    )

    documents2 = get_paper_documents(
        filename2
    )

    if not documents1:

        raise ValueError(
            f"No indexed content found for {filename1}"
        )

    if not documents2:

        raise ValueError(
            f"No indexed content found for {filename2}"
        )

    text1 = "\n\n".join(
        f"[Page {item['page']}]\n"
        f"{item['text']}"
        for item in documents1
    )

    text2 = "\n\n".join(
        f"[Page {item['page']}]\n"
        f"{item['text']}"
        for item in documents2
    )

    text1 = text1[:30000]
    text2 = text2[:30000]

    prompt = f"""
You are an academic research assistant.

Compare these two research papers.

PAPER 1:
{filename1}

{text1}

PAPER 2:
{filename2}

{text2}

Return:

# Research Paper Comparison

## 1. Overview

## 2. Research Objectives

## 3. Problem Statements

## 4. Methodologies

## 5. Datasets / Experimental Setup

## 6. Key Findings

## 7. Main Contributions

## 8. Limitations

## 9. Future Work

## 10. Similarities

## 11. Differences

## 12. Overall Comparison

Do not invent information.
If unavailable, write:
"Not specified in the paper."
"""

    comparison = generate_text(
        prompt
    )

    return {
        "filename1": filename1,
        "filename2": filename2,
        "comparison": comparison
    }


# ============================================================
# RESEARCH GAPS
# ============================================================

def find_research_gaps(
    filename
):
    """
    Identify research gaps.
    """

    documents = get_paper_documents(
        filename
    )

    if not documents:

        raise ValueError(
            f"No indexed content found for {filename}"
        )

    paper_text = "\n\n".join(
        f"[Page {item['page']}]\n"
        f"{item['text']}"
        for item in documents
    )

    paper_text = paper_text[:40000]

    prompt = f"""
You are an academic research-gap analysis assistant.

Analyze:

Paper:
{filename}

Content:

{paper_text}

Return:

# Research Gap Analysis

## 1. Existing Research Focus

## 2. Limitations Identified

## 3. Unresolved Problems

## 4. Research Gaps

## 5. Potential Research Opportunities

## 6. Suggested Directions

Base the analysis on the supplied paper.

Clearly distinguish the paper's claims
from proposed research interpretations.
"""

    gaps = generate_text(
        prompt
    )

    return {
        "filename": filename,
        "gaps": gaps
    }


# ============================================================
# RESEARCH TOPICS
# ============================================================

def generate_research_topics(
    filename
):
    """
    Generate research topics.
    """

    documents = get_paper_documents(
        filename
    )

    if not documents:

        raise ValueError(
            f"No indexed content found for {filename}"
        )

    paper_text = "\n\n".join(
        f"[Page {item['page']}]\n"
        f"{item['text']}"
        for item in documents
    )

    paper_text = paper_text[:40000]

    prompt = f"""
You are an academic research topic generator.

Analyze:

Paper:
{filename}

Content:

{paper_text}

Generate 8-10 realistic research topics.

For each topic provide:

## Topic
### Title
### Motivation
### Research Problem
### Possible Approach
### Expected Contribution

Topics must be:

- academically meaningful
- technically feasible
- related to the paper
- suitable for student research
- specific

Do not claim proposed topics have already
been experimentally proven.
"""

    topics = generate_text(
        prompt
    )

    return {
        "filename": filename,
        "topics": topics
    }


# ============================================================
# RESEARCH PROPOSAL
# ============================================================

def generate_research_proposal(
    filename,
    research_topic
):
    """
    Generate a complete research proposal.
    """

    if not research_topic.strip():

        raise ValueError(
            "Research topic cannot be empty."
        )

    documents = get_paper_documents(
        filename
    )

    if not documents:

        raise ValueError(
            f"No indexed content found for {filename}"
        )

    paper_text = "\n\n".join(
        f"[Page {item['page']}]\n"
        f"{item['text']}"
        for item in documents
    )

    paper_text = paper_text[:40000]

    prompt = f"""
You are an academic research proposal assistant.

Create a complete research proposal for:

{research_topic}

Use the following research paper as
academic background:

{filename}

Paper content:

{paper_text}

Return exactly:

# Research Proposal

## 1. Proposed Title

## 2. Abstract

## 3. Introduction

## 4. Background and Motivation

## 5. Problem Statement

## 6. Research Gap

## 7. Research Objectives

## 8. Research Questions

## 9. Proposed Methodology

### 9.1 Data Collection

### 9.2 Data Preprocessing

### 9.3 Proposed System / Model

### 9.4 Experimental Design

### 9.5 Evaluation Metrics

## 10. Expected Results

## 11. Expected Contributions

## 12. Scope of the Research

## 13. Limitations

## 14. Future Work

## 15. Proposed Timeline

## 16. Conclusion

## 17. Keywords

Important:

- Do not fabricate experimental results.
- Do not claim experiments have already been performed.
- Clearly distinguish source-paper information
  from proposed research.
- Keep the proposal academically realistic.
"""

    proposal = generate_text(
        prompt
    )

    return {
        "filename": filename,
        "research_topic": research_topic,
        "proposal": proposal
    }


# ============================================================
# GET UPLOADED PAPERS
# ============================================================

def get_uploaded_papers():
    """
    Return metadata for uploaded PDF files.
    """

    papers = []

    for pdf_path in sorted(
        UPLOAD_FOLDER.glob("*.pdf")
    ):

        try:

            size = pdf_path.stat().st_size

        except OSError:

            size = 0

        papers.append(
            {
                "filename": pdf_path.name,
                "size": size,
                "url": (
                    f"/papers/{pdf_path.name}"
                )
            }
        )

    return papers


# ============================================================
# STARTUP
# ============================================================

if __name__ == "__main__":

    print("=" * 60)
    print("ResearchAI RAG System")
    print("=" * 60)

    print(
        f"Upload folder: {UPLOAD_FOLDER}"
    )

    print(
        f"Vector storage: {VECTOR_FILE}"
    )

    print(
        f"Uploaded PDFs: "
        f"{len(get_uploaded_papers())}"
    )

    print("=" * 60)