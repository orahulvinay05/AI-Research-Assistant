# ============================================================
# AI RESEARCH ASSISTANT - RAG SERVICE
# ============================================================

import os

from dotenv import load_dotenv

# ============================================================
# LOAD ENVIRONMENT VARIABLES
# ============================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

ENV_FILE = os.path.join(BASE_DIR, ".env")

load_dotenv(ENV_FILE)


# ============================================================
# IMPORT LIBRARIES
# ============================================================

import fitz

from langchain_text_splitters import RecursiveCharacterTextSplitter

from langchain_huggingface import HuggingFaceEmbeddings

from langchain_chroma import Chroma

from langchain_google_genai import ChatGoogleGenerativeAI


# ============================================================
# DIRECTORIES
# ============================================================

UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")

CHROMA_DIR = os.path.join(BASE_DIR, "chroma_db")

os.makedirs(UPLOAD_FOLDER, exist_ok=True)


# ============================================================
# EMBEDDING MODEL
# ============================================================

print("Loading embedding model...")

embeddings = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2"
)

print("Embedding model loaded.")


# ============================================================
# GEMINI MODEL
# ============================================================

llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    temperature=0
)

print("Gemini model loaded.")


# ============================================================
# EXTRACT TEXT FROM PDF
# ============================================================

def extract_text_from_pdf(pdf_path):

    document = fitz.open(pdf_path)

    text = ""

    for page in document:

        text += page.get_text() + "\n"

    document.close()

    return text


# ============================================================
# CREATE RAG DATABASE
# ============================================================

def create_rag_database(pdf_path):

    print("\nReading PDF...")

    text = extract_text_from_pdf(pdf_path)

    if not text.strip():

        raise ValueError(
            "Could not extract text from the PDF."
        )

    print("Text extracted successfully.")

    # --------------------------------------------------------
    # Split text
    # --------------------------------------------------------

    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200
    )

    chunks = text_splitter.split_text(text)

    print("Number of chunks:", len(chunks))

    # --------------------------------------------------------
    # Create ChromaDB
    # --------------------------------------------------------

    vector_database = Chroma.from_texts(
        texts=chunks,
        embedding=embeddings,
        persist_directory=CHROMA_DIR,
        collection_name="research_papers"
    )

    print("ChromaDB created successfully.")

    return len(chunks)


# ============================================================
# ASK QUESTION
# ============================================================

def ask_question(question):

    if not question.strip():

        raise ValueError(
            "Question cannot be empty."
        )

    # --------------------------------------------------------
    # Load existing ChromaDB
    # --------------------------------------------------------

    vector_database = Chroma(
        persist_directory=CHROMA_DIR,
        collection_name="research_papers",
        embedding_function=embeddings
    )

    # --------------------------------------------------------
    # Semantic search
    # --------------------------------------------------------

    results = vector_database.similarity_search(
        question,
        k=3
    )

    if not results:

        return "I could not find this information in the document."

    # --------------------------------------------------------
    # Create context
    # --------------------------------------------------------

    context = "\n\n".join(
        result.page_content
        for result in results
    )

    # --------------------------------------------------------
    # Gemini prompt
    # --------------------------------------------------------

    prompt = f"""
You are an AI Research Assistant.

Answer the user's question using ONLY the information
contained in the provided document context.

Do not invent information.

If the answer cannot be found in the document,
say:

"I could not find this information in the document."

DOCUMENT CONTEXT:

{context}

USER QUESTION:

{question}

Give a clear and concise answer.
"""

    # --------------------------------------------------------
    # Ask Gemini
    # --------------------------------------------------------

    response = llm.invoke(prompt)

    return response.content