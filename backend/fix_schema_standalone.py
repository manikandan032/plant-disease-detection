import os
import sys
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Redirect stdout/stderr to file
log_file = open("fix_log.txt", "w")
sys.stdout = log_file
sys.stderr = log_file

def log(msg):
    print(msg)
    log_file.flush()

# Load env variables manually
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    log("DATABASE_URL not found!")
    exit(1)

log(f"Original DATABASE_URL: {DATABASE_URL}")

if "localhost" in DATABASE_URL:
    DATABASE_URL = DATABASE_URL.replace("localhost", "127.0.0.1")
    log(f"Modified DATABASE_URL: {DATABASE_URL}")

if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

try:
    log("Creating engine...")
    engine = create_engine(DATABASE_URL)
    log("Connecting...")
    with engine.connect() as conn:
        log("Connected. Checking 'users' table schema...")
        result = conn.execute(text("DESCRIBE users"))
        columns = [row[0] for row in result.fetchall()]
        log(f"Existing columns: {columns}")
        
        if 'upi_id' not in columns:
            log("Adding missing column 'upi_id'...")
            conn.execute(text("ALTER TABLE users ADD COLUMN upi_id VARCHAR(50) NULL;"))
            conn.commit()
            log("Column 'upi_id' added.")
        else:
            log("Column 'upi_id' already exists.")
            
        if 'role' not in columns:
            log("Adding missing column 'role'...")
            conn.execute(text("ALTER TABLE users ADD COLUMN role VARCHAR(50) DEFAULT 'farmer';"))
            conn.commit()
            log("Column 'role' added.")
            
        if 'is_admin' not in columns:
            log("Adding missing column 'is_admin'...")
            conn.execute(text("ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT 0;"))
            conn.commit()
            log("Column 'is_admin' added.")
            
    log("Done.")

except Exception as e:
    log(f"Error: {e}")
