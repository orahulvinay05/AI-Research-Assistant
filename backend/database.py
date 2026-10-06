import sqlite3
import json
from pathlib import Path
from datetime import datetime


# ============================================================
# DATABASE CONFIGURATION
# ============================================================

BASE_DIR = Path(__file__).resolve().parent
DATABASE_PATH = BASE_DIR / "researchai.db"


# ============================================================
# DATABASE CONNECTION
# ============================================================

def get_connection():
    """
    Create and return a SQLite database connection.
    """
    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row
    return connection


# ============================================================
# INITIALIZE DATABASE
# ============================================================

def initialize_database():
    """
    Create the required database tables if they do not exist.
    """

    connection = get_connection()
    cursor = connection.cursor()

    # --------------------------------------------------------
    # Chats table
    # --------------------------------------------------------

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS chats (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            filename TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
        """
    )

    # --------------------------------------------------------
    # Messages table
    # --------------------------------------------------------

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            chat_id INTEGER NOT NULL,
            role TEXT NOT NULL,
            content TEXT NOT NULL,
            sources INTEGER DEFAULT 0,
            source_details TEXT,
            created_at TEXT NOT NULL,

            FOREIGN KEY (chat_id)
            REFERENCES chats(id)
            ON DELETE CASCADE
        )
        """
    )

    connection.commit()
    connection.close()


# ============================================================
# CREATE CHAT
# ============================================================

def create_chat(title, filename=None):
    """
    Create a new research chat.

    Returns:
        int: newly created chat ID
    """

    connection = get_connection()
    cursor = connection.cursor()

    now = datetime.now().isoformat()

    cursor.execute(
        """
        INSERT INTO chats (
            title,
            filename,
            created_at,
            updated_at
        )
        VALUES (?, ?, ?, ?)
        """,
        (
            title,
            filename,
            now,
            now,
        ),
    )

    chat_id = cursor.lastrowid

    connection.commit()
    connection.close()

    return chat_id


# ============================================================
# ADD MESSAGE
# ============================================================

def add_message(
    chat_id,
    role,
    content,
    sources=0,
    source_details=None,
):
    """
    Add a user or assistant message to a chat.
    """

    connection = get_connection()
    cursor = connection.cursor()

    now = datetime.now().isoformat()

    # Convert source details into JSON before storing.
    source_details_json = None

    if source_details is not None:
        try:
            source_details_json = json.dumps(source_details)
        except Exception:
            source_details_json = json.dumps([])

    cursor.execute(
        """
        INSERT INTO messages (
            chat_id,
            role,
            content,
            sources,
            source_details,
            created_at
        )
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (
            chat_id,
            role,
            content,
            sources,
            source_details_json,
            now,
        ),
    )

    # Update chat's last activity time.
    cursor.execute(
        """
        UPDATE chats
        SET updated_at = ?
        WHERE id = ?
        """,
        (
            now,
            chat_id,
        ),
    )

    connection.commit()
    connection.close()


# ============================================================
# GET ALL CHATS
# ============================================================

def get_all_chats():
    """
    Return all saved chats.

    Most recently updated chats are returned first.
    """

    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute(
        """
        SELECT
            id,
            title,
            filename,
            created_at,
            updated_at
        FROM chats
        ORDER BY updated_at DESC
        """
    )

    rows = cursor.fetchall()

    connection.close()

    return [dict(row) for row in rows]


# ============================================================
# GET SINGLE CHAT
# ============================================================

def get_chat(chat_id):
    """
    Return a chat and all its messages.
    """

    connection = get_connection()
    cursor = connection.cursor()

    # --------------------------------------------------------
    # Get chat
    # --------------------------------------------------------

    cursor.execute(
        """
        SELECT
            id,
            title,
            filename,
            created_at,
            updated_at
        FROM chats
        WHERE id = ?
        """,
        (chat_id,),
    )

    chat_row = cursor.fetchone()

    if chat_row is None:
        connection.close()
        return None

    chat = dict(chat_row)

    # --------------------------------------------------------
    # Get messages
    # --------------------------------------------------------

    cursor.execute(
        """
        SELECT
            id,
            chat_id,
            role,
            content,
            sources,
            source_details,
            created_at
        FROM messages
        WHERE chat_id = ?
        ORDER BY id ASC
        """,
        (chat_id,),
    )

    message_rows = cursor.fetchall()

    messages = []

    for row in message_rows:

        message = dict(row)

        # Convert stored JSON source details back to Python.
        if message.get("source_details"):
            try:
                message["sourceDetails"] = json.loads(
                    message["source_details"]
                )
            except Exception:
                message["sourceDetails"] = []
        else:
            message["sourceDetails"] = []

        # Keep API response clean.
        message.pop("source_details", None)

        messages.append(message)

    chat["messages"] = messages

    connection.close()

    return chat


# ============================================================
# DELETE CHAT
# ============================================================

def delete_chat(chat_id):
    """
    Delete a chat and all associated messages.
    """

    connection = get_connection()
    cursor = connection.cursor()

    # Delete messages first for compatibility with SQLite
    # configurations where foreign-key cascading may not be enabled.
    cursor.execute(
        """
        DELETE FROM messages
        WHERE chat_id = ?
        """,
        (chat_id,),
    )

    cursor.execute(
        """
        DELETE FROM chats
        WHERE id = ?
        """,
        (chat_id,),
    )

    deleted = cursor.rowcount > 0

    connection.commit()
    connection.close()

    return deleted


# ============================================================
# UPDATE CHAT TITLE
# ============================================================

def update_chat_title(chat_id, title):
    """
    Update the title of an existing chat.
    """

    connection = get_connection()
    cursor = connection.cursor()

    now = datetime.now().isoformat()

    cursor.execute(
        """
        UPDATE chats
        SET
            title = ?,
            updated_at = ?
        WHERE id = ?
        """,
        (
            title,
            now,
            chat_id,
        ),
    )

    updated = cursor.rowcount > 0

    connection.commit()
    connection.close()

    return updated


# ============================================================
# INITIALIZE DATABASE ON IMPORT
# ============================================================

initialize_database()