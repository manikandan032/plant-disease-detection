import os
import sys
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Redirect stdout/stderr to file
log_file = open("verify_db.txt", "w")
sys.stdout = log_file
sys.stderr = log_file

def log(msg):
    print(msg)
    log_file.flush()

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    log("No DB URL")
    exit(1)

if "localhost" in DATABASE_URL:
    DATABASE_URL = DATABASE_URL.replace("localhost", "127.0.0.1")

try:
    engine = create_engine(DATABASE_URL)
    with engine.connect() as conn:
        log("Checking tables...")
        result = conn.execute(text("SHOW TABLES"))
        tables = [row[0] for row in result.fetchall()]
        log(f"Tables: {tables}")
        
        if 'orders' not in tables:
            log("Table 'orders' is MISSING.")
        else:
            log("Table 'orders' exists.")
            
    log("Done.")
except Exception as e:
    log(f"Error: {e}")
