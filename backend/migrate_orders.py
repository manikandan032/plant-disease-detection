
import os
import sys
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Set unbuffered output
sys.stdout.reconfigure(line_buffering=True)

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("No DATABASE_URL found")
    exit(1)

if "localhost" in DATABASE_URL:
    DATABASE_URL = DATABASE_URL.replace("localhost", "127.0.0.1")

print(f"Connecting to {DATABASE_URL}...")
engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    print("Connected! Checking 'orders' table...")
    try:
        # Check columns
        result = conn.execute(text("DESCRIBE orders"))
        columns = [row[0] for row in result.fetchall()]
        print(f"Current columns: {columns}")
        
        # Add payment_method if missing
        if 'payment_method' not in columns:
            print("Adding 'payment_method' column...")
            conn.execute(text("ALTER TABLE orders ADD COLUMN payment_method VARCHAR(50) DEFAULT 'UPI'"))
            print("Done adding payment_method.")
        else:
            print("'payment_method' exists.")

        # Add payment_status if missing
        if 'payment_status' not in columns:
            print("Adding 'payment_status' column...")
            conn.execute(text("ALTER TABLE orders ADD COLUMN payment_status VARCHAR(50) DEFAULT 'Unpaid'"))
            print("Done adding payment_status.")
        else:
            print("'payment_status' exists.")
            
        # Add transaction_id if missing
        if 'transaction_id' not in columns:
            print("Adding 'transaction_id' column...")
            # Note: transaction_id is nullable
            conn.execute(text("ALTER TABLE orders ADD COLUMN transaction_id VARCHAR(255)"))
            print("Done adding transaction_id.")
        else:
            print("'transaction_id' exists.")
            
        conn.commit()
        print("Migration complete successfully.")
        
    except Exception as e:
        print(f"Error during migration: {e}")
