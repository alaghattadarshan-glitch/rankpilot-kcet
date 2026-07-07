"""
Comprehensive migration script to sync the old kcet.db schema
with the current SQLAlchemy models.
Safe to run multiple times — uses IF NOT EXISTS / PRAGMA checks.
"""
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "kcet.db")

def add_column_if_missing(cur, table, column, col_type, default=None):
    cur.execute(f"PRAGMA table_info({table})")
    cols = [row[1] for row in cur.fetchall()]
    if column not in cols:
        default_clause = f" DEFAULT {default}" if default is not None else ""
        cur.execute(f"ALTER TABLE {table} ADD COLUMN {column} {col_type}{default_clause}")
        print(f"  + Added {table}.{column}")
    else:
        print(f"  . {table}.{column} already exists")

NEW_TABLES = [
    ("login_history", """CREATE TABLE IF NOT EXISTS login_history (
        id VARCHAR NOT NULL,
        user_id VARCHAR,
        email VARCHAR NOT NULL,
        ip_address VARCHAR,
        user_agent VARCHAR,
        login_time DATETIME,
        PRIMARY KEY (id),
        FOREIGN KEY(user_id) REFERENCES users (id)
    )"""),
    ("activity_logs", """CREATE TABLE IF NOT EXISTS activity_logs (
        id VARCHAR NOT NULL,
        user_id VARCHAR,
        activity_type VARCHAR NOT NULL,
        timestamp DATETIME,
        PRIMARY KEY (id),
        FOREIGN KEY(user_id) REFERENCES users (id)
    )"""),
    ("feedback_logs", """CREATE TABLE IF NOT EXISTS feedback_logs (
        id VARCHAR NOT NULL,
        user_id VARCHAR,
        college_code VARCHAR NOT NULL,
        branch_code VARCHAR NOT NULL,
        action VARCHAR NOT NULL,
        timestamp DATETIME,
        PRIMARY KEY (id),
        FOREIGN KEY(user_id) REFERENCES users (id)
    )"""),
    ("contact_inquiries", """CREATE TABLE IF NOT EXISTS contact_inquiries (
        id VARCHAR NOT NULL,
        name VARCHAR NOT NULL,
        email VARCHAR NOT NULL,
        phone VARCHAR,
        subject VARCHAR NOT NULL,
        message VARCHAR NOT NULL,
        submitted_date DATETIME,
        status VARCHAR DEFAULT 'New',
        PRIMARY KEY (id)
    )"""),
    ("pdf_report_logs", """CREATE TABLE IF NOT EXISTS pdf_report_logs (
        id VARCHAR NOT NULL,
        user_id VARCHAR,
        action VARCHAR NOT NULL,
        timestamp DATETIME,
        PRIMARY KEY (id),
        FOREIGN KEY(user_id) REFERENCES users (id)
    )"""),
    ("dataset_uploads", """CREATE TABLE IF NOT EXISTS dataset_uploads (
        id VARCHAR NOT NULL,
        filename VARCHAR NOT NULL,
        dataset_type VARCHAR NOT NULL,
        year INTEGER NOT NULL,
        upload_date DATETIME,
        records_count INTEGER DEFAULT 0,
        quality_score REAL DEFAULT 100.0,
        status VARCHAR DEFAULT 'pending',
        preview_data JSON,
        PRIMARY KEY (id)
    )"""),
    ("mentor_chats", """CREATE TABLE IF NOT EXISTS mentor_chats (
        id VARCHAR NOT NULL,
        user_id VARCHAR,
        question VARCHAR NOT NULL,
        answer VARCHAR NOT NULL,
        timestamp DATETIME,
        PRIMARY KEY (id),
        FOREIGN KEY(user_id) REFERENCES users (id)
    )"""),
    ("branch_recommendation_logs", """CREATE TABLE IF NOT EXISTS branch_recommendation_logs (
        id VARCHAR NOT NULL,
        user_id VARCHAR,
        scores JSON NOT NULL,
        reasoning JSON,
        timestamp DATETIME,
        PRIMARY KEY (id),
        FOREIGN KEY(user_id) REFERENCES users (id)
    )"""),
    ("shortlists", """CREATE TABLE IF NOT EXISTS shortlists (
        id VARCHAR NOT NULL,
        user_id VARCHAR,
        college_code VARCHAR,
        branch_code VARCHAR,
        created_at DATETIME,
        PRIMARY KEY (id),
        FOREIGN KEY(user_id) REFERENCES users (id)
    )"""),
]

def fix_bad_tables(cur):
    """
    Drop and recreate tables that were created with wrong schemas
    in earlier migration runs.
    """
    # activity_logs was created with 'action' column but model needs 'activity_type'
    cur.execute("PRAGMA table_info(activity_logs)")
    cols = [row[1] for row in cur.fetchall()]
    if cols and "activity_type" not in cols:
        print("  ! Fixing activity_logs (wrong column 'action' -> 'activity_type')...")
        cur.execute("DROP TABLE activity_logs")

    # contact_inquiries may be missing phone/subject/submitted_date columns
    cur.execute("PRAGMA table_info(contact_inquiries)")
    cols = [row[1] for row in cur.fetchall()]
    if cols and "subject" not in cols:
        print("  ! Fixing contact_inquiries (missing subject/phone/submitted_date)...")
        cur.execute("DROP TABLE contact_inquiries")

    # dataset_uploads may be missing year/records_count/quality_score/preview_data
    cur.execute("PRAGMA table_info(dataset_uploads)")
    cols = [row[1] for row in cur.fetchall()]
    if cols and "year" not in cols:
        print("  ! Fixing dataset_uploads (missing year/records_count/quality_score)...")
        cur.execute("DROP TABLE dataset_uploads")

    # feedback_logs may be missing college_code/branch_code columns
    cur.execute("PRAGMA table_info(feedback_logs)")
    cols = [row[1] for row in cur.fetchall()]
    if cols and "college_code" not in cols:
        print("  ! Fixing feedback_logs (missing college_code/branch_code)...")
        cur.execute("DROP TABLE feedback_logs")


def migrate():
    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA journal_mode=WAL")
    cur = conn.cursor()

    print("\n=== Migrating: users ===")
    add_column_if_missing(cur, "users", "last_login", "DATETIME")

    print("\n=== Migrating: colleges ===")
    add_column_if_missing(cur, "colleges", "is_active", "BOOLEAN", "1")

    print("\n=== Migrating: branches ===")
    add_column_if_missing(cur, "branches", "is_active", "BOOLEAN", "1")

    print("\n=== Migrating: student_preferences ===")
    add_column_if_missing(cur, "student_preferences", "counselling_round", "VARCHAR", "'Mock'")

    print("\n=== Fixing bad tables from earlier migrations ===")
    fix_bad_tables(cur)
    conn.commit()  # commit drops before recreating

    print("\n=== Creating / verifying all tables ===")
    for table_name, ddl in NEW_TABLES:
        try:
            cur.execute(ddl)
            print(f"  OK: {table_name}")
        except Exception as e:
            print(f"  SKIP {table_name}: {e}")

    conn.commit()
    conn.close()
    print("\nMigration complete!")

if __name__ == "__main__":
    migrate()
