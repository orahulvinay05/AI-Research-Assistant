import os
import re
from pathlib import Path

from fastapi import (
    FastAPI,
    File,
    UploadFile,
    HTTPException,
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel

from rag import (
    UPLOAD_FOLDER,
    ask_question,
    process_pdf,
    get_uploaded_papers,
    summarize_paper,
    compare_papers,
    find_research_gaps,
    generate_research_topics,
    generate_research_proposal,
)

from database import (
    add_message,
    create_chat,
    delete_chat,
    get_all_chats,
    get_chat,
)


# ============================================================
# FASTAPI APPLICATION
# ============================================================

app = FastAPI(
    title="ResearchAI API",
    description=(
        "AI-powered research assistant using "
        "RAG and Google Gemini."
    ),
    version="1.0.0",
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# CONSTANTS
# ============================================================

MAX_FILE_SIZE = 20 * 1024 * 1024

ALLOWED_EXTENSION = ".pdf"


# ============================================================
# REQUEST MODELS
# ============================================================

class QuestionRequest(BaseModel):
    question: str
    filename: str | None = None
    chat_id: int | None = None


class ChatCreateRequest(BaseModel):
    title: str
    filename: str | None = None


class CompareRequest(BaseModel):
    filename1: str
    filename2: str


class ResearchGapRequest(BaseModel):
    filename: str


class ResearchTopicRequest(BaseModel):
    filename: str


class ResearchProposalRequest(BaseModel):
    filename: str
    research_topic: str


# ============================================================
# HELPER FUNCTIONS
# ============================================================

def sanitize_filename(filename: str) -> str:
    """
    Safely normalize an uploaded filename.
    """

    filename = Path(
        filename
    ).name

    filename = re.sub(
        r"[^A-Za-z0-9._()\- ]+",
        "_",
        filename,
    )

    filename = filename.strip()

    if not filename:
        filename = "uploaded_paper.pdf"

    return filename


def validate_pdf_filename(filename: str):
    """
    Validate that the filename is a PDF.
    """

    if not filename.lower().endswith(
        ALLOWED_EXTENSION
    ):
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are allowed.",
        )


def get_safe_pdf_path(filename: str) -> Path:
    """
    Return a safe PDF path inside uploads folder.
    """

    safe_name = Path(
        filename
    ).name

    pdf_path = (
        UPLOAD_FOLDER / safe_name
    ).resolve()

    upload_root = (
        UPLOAD_FOLDER.resolve()
    )

    try:

        pdf_path.relative_to(
            upload_root
        )

    except ValueError:

        raise HTTPException(
            status_code=400,
            detail="Invalid filename.",
        )

    return pdf_path


# ============================================================
# ROOT
# ============================================================

@app.get("/")
def root():
    return {
        "name": "ResearchAI",
        "status": "online",
        "version": "1.0.0",
    }


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/health")
def health():
    return {
        "status": "healthy",
    }


# ============================================================
# UPLOAD PDF
# ============================================================

@app.post("/upload")
async def upload_pdf(
    file: UploadFile = File(...)
):
    """
    Upload and process a PDF research paper.
    """

    if not file.filename:

        raise HTTPException(
            status_code=400,
            detail="No filename provided.",
        )

    validate_pdf_filename(
        file.filename
    )

    filename = sanitize_filename(
        file.filename
    )

    pdf_path = (
        UPLOAD_FOLDER / filename
    )

    try:

        content = await file.read()

    except Exception as exc:

        raise HTTPException(
            status_code=500,
            detail=(
                "Could not read uploaded file: "
                f"{exc}"
            ),
        )

    if not content:

        raise HTTPException(
            status_code=400,
            detail="Uploaded file is empty.",
        )

    if len(content) > MAX_FILE_SIZE:

        raise HTTPException(
            status_code=413,
            detail=(
                "File is too large. "
                "Maximum size is 20 MB."
            ),
        )

    try:

        with open(
            pdf_path,
            "wb"
        ) as output_file:

            output_file.write(
                content
            )

        result = process_pdf(
            pdf_path
        )

        return {
            "message": (
                "PDF uploaded and processed successfully."
            ),
            **result,
        }

    except Exception as exc:

        # Remove incomplete upload if processing fails.
        try:

            if pdf_path.exists():
                pdf_path.unlink()

        except Exception:
            pass

        raise HTTPException(
            status_code=500,
            detail=str(exc),
        )


# ============================================================
# ASK AI
# ============================================================

@app.post("/ask")
def ask(
    request: QuestionRequest
):
    """
    Ask ResearchAI a question.
    """

    question = request.question.strip()

    if not question:

        raise HTTPException(
            status_code=400,
            detail="Question cannot be empty.",
        )

    chat_id = request.chat_id

    try:

        # ----------------------------------------------------
        # Create chat automatically if necessary.
        # ----------------------------------------------------

        if chat_id is None:

            title = question

            if len(title) > 60:
                title = title[:57] + "..."

            chat_id = create_chat(
                title=title,
                filename=request.filename,
            )

        else:

            existing_chat = get_chat(
                chat_id
            )

            if existing_chat is None:

                raise HTTPException(
                    status_code=404,
                    detail="Chat not found.",
                )

        # ----------------------------------------------------
        # Save user message.
        # ----------------------------------------------------

        add_message(
            chat_id=chat_id,
            role="user",
            content=question,
        )

        # ----------------------------------------------------
        # Generate AI answer.
        # ----------------------------------------------------

        result = ask_question(
            question=question,
            filename=request.filename,
        )

        # ----------------------------------------------------
        # Save AI answer.
        # ----------------------------------------------------

        add_message(
            chat_id=chat_id,
            role="assistant",
            content=result["answer"],
            sources=result.get(
                "sources",
                0,
            ),
            source_details=result.get(
                "source_details",
                [],
            ),
        )

        return {
            "chat_id": chat_id,
            "answer": result["answer"],
            "sources": result.get(
                "sources",
                0,
            ),
            "source_details": result.get(
                "source_details",
                [],
            ),
        }

    except HTTPException:
        raise

    except Exception as exc:

        raise HTTPException(
            status_code=500,
            detail=str(exc),
        )


# ============================================================
# LIST CHATS
# ============================================================

@app.get("/chats")
def list_chats():
    """
    Return all saved chats.
    """

    try:

        return {
            "chats": get_all_chats()
        }

    except Exception as exc:

        raise HTTPException(
            status_code=500,
            detail=str(exc),
        )


# ============================================================
# GET CHAT
# ============================================================

@app.get("/chats/{chat_id}")
def get_chat_by_id(
    chat_id: int
):
    """
    Return one chat and all messages.
    """

    chat = get_chat(
        chat_id
    )

    if chat is None:

        raise HTTPException(
            status_code=404,
            detail="Chat not found.",
        )

    return chat


# ============================================================
# CREATE CHAT
# ============================================================

@app.post("/chats")
def create_new_chat(
    request: ChatCreateRequest
):
    """
    Create an empty research chat.
    """

    title = request.title.strip()

    if not title:

        title = "New Research Chat"

    try:

        chat_id = create_chat(
            title=title,
            filename=request.filename,
        )

        return {
            "chat_id": chat_id,
            "title": title,
            "filename": request.filename,
        }

    except Exception as exc:

        raise HTTPException(
            status_code=500,
            detail=str(exc),
        )


# ============================================================
# DELETE CHAT
# ============================================================

@app.delete("/chats/{chat_id}")
def remove_chat(
    chat_id: int
):
    """
    Delete a saved chat.
    """

    try:

        deleted = delete_chat(
            chat_id
        )

        if not deleted:

            raise HTTPException(
                status_code=404,
                detail="Chat not found.",
            )

        return {
            "message": "Chat deleted successfully.",
        }

    except HTTPException:
        raise

    except Exception as exc:

        raise HTTPException(
            status_code=500,
            detail=str(exc),
        )


# ============================================================
# GET PAPERS
# ============================================================

@app.get("/papers")
def list_papers():
    """
    Return all uploaded papers.
    """

    try:

        return {
            "papers": get_uploaded_papers()
        }

    except Exception as exc:

        raise HTTPException(
            status_code=500,
            detail=str(exc),
        )


# ============================================================
# GET SINGLE PAPER
# ============================================================

@app.get("/papers/{filename}")
def get_paper(
    filename: str
):
    """
    Return the PDF file.
    """

    pdf_path = get_safe_pdf_path(
        filename
    )

    if not pdf_path.exists():

        raise HTTPException(
            status_code=404,
            detail="Paper not found.",
        )

    return FileResponse(
        path=str(pdf_path),
        media_type="application/pdf",
        filename=pdf_path.name,
    )


# ============================================================
# DELETE PAPER
# ============================================================

@app.delete("/papers/{filename}")
def delete_paper(
    filename: str
):
    """
    Delete an uploaded paper and its
    local vector data.
    """

    pdf_path = get_safe_pdf_path(
        filename
    )

    if not pdf_path.exists():

        raise HTTPException(
            status_code=404,
            detail="Paper not found.",
        )

    try:

        pdf_path.unlink()

        # Import only here to avoid unnecessary startup work.
        from rag import delete_paper_vectors

        delete_paper_vectors(
            filename
        )

        return {
            "message": (
                "Paper deleted successfully."
            ),
            "filename": filename,
        }

    except Exception as exc:

        raise HTTPException(
            status_code=500,
            detail=str(exc),
        )


# ============================================================
# SUMMARIZE PAPER
# ============================================================

@app.post("/summarize")
def summarize(
    request: ResearchGapRequest
):
    """
    Generate a structured summary.
    """

    filename = request.filename.strip()

    if not filename:

        raise HTTPException(
            status_code=400,
            detail="Filename is required.",
        )

    try:

        result = summarize_paper(
            filename
        )

        return result

    except ValueError as exc:

        raise HTTPException(
            status_code=404,
            detail=str(exc),
        )

    except Exception as exc:

        raise HTTPException(
            status_code=500,
            detail=str(exc),
        )


# ============================================================
# COMPARE PAPERS
# ============================================================

@app.post("/compare")
def compare(
    request: CompareRequest
):
    """
    Compare two research papers.
    """

    filename1 = request.filename1.strip()
    filename2 = request.filename2.strip()

    if not filename1 or not filename2:

        raise HTTPException(
            status_code=400,
            detail=(
                "Both paper filenames are required."
            ),
        )

    if filename1 == filename2:

        raise HTTPException(
            status_code=400,
            detail=(
                "Please select two different papers."
            ),
        )

    try:

        result = compare_papers(
            filename1,
            filename2,
        )

        return result

    except ValueError as exc:

        raise HTTPException(
            status_code=404,
            detail=str(exc),
        )

    except Exception as exc:

        raise HTTPException(
            status_code=500,
            detail=str(exc),
        )


# ============================================================
# RESEARCH GAPS
# ============================================================

@app.post("/research-gaps")
def research_gaps(
    request: ResearchGapRequest
):
    """
    Identify research gaps.
    """

    filename = request.filename.strip()

    if not filename:

        raise HTTPException(
            status_code=400,
            detail="Filename is required.",
        )

    try:

        result = find_research_gaps(
            filename
        )

        return result

    except ValueError as exc:

        raise HTTPException(
            status_code=404,
            detail=str(exc),
        )

    except Exception as exc:

        raise HTTPException(
            status_code=500,
            detail=str(exc),
        )


# ============================================================
# RESEARCH TOPICS
# ============================================================

@app.post("/research-topics")
def research_topics(
    request: ResearchTopicRequest
):
    """
    Generate research topics.
    """

    filename = request.filename.strip()

    if not filename:

        raise HTTPException(
            status_code=400,
            detail="Filename is required.",
        )

    try:

        result = generate_research_topics(
            filename
        )

        return result

    except ValueError as exc:

        raise HTTPException(
            status_code=404,
            detail=str(exc),
        )

    except Exception as exc:

        raise HTTPException(
            status_code=500,
            detail=str(exc),
        )


# ============================================================
# RESEARCH PROPOSAL
# ============================================================

@app.post("/research-proposal")
def research_proposal(
    request: ResearchProposalRequest
):
    """
    Generate a research proposal.
    """

    filename = request.filename.strip()

    research_topic = (
        request.research_topic.strip()
    )

    if not filename:

        raise HTTPException(
            status_code=400,
            detail="Filename is required.",
        )

    if not research_topic:

        raise HTTPException(
            status_code=400,
            detail=(
                "Research topic is required."
            ),
        )

    try:

        result = generate_research_proposal(
            filename,
            research_topic,
        )

        return result

    except ValueError as exc:

        raise HTTPException(
            status_code=404,
            detail=str(exc),
        )

    except Exception as exc:

        raise HTTPException(
            status_code=500,
            detail=str(exc),
        )


# ============================================================
# SERVER START
# ============================================================

if __name__ == "__main__":

    import uvicorn

    uvicorn.run(
        "main:app",
        host="127.0.0.1",
        port=8000,
        reload=False,
    )