#!/usr/bin/env python3
"""
Migration script to add is_active column to users table
Run this once after updating the model
"""
import mysql.connector
from mysql.connector import Error
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

DB_HOST = os.getenv('DB_HOST', 'localhost')
DB_USER = os.getenv('DB_USER', 'root')
DB_PASSWORD = os.getenv('DB_PASSWORD', '')
DB_NAME = os.getenv('DB_NAME', 'plant_disease')

def run_migration():
    try:
        # Connect to database
        connection = mysql.connector.connect(
            host=DB_HOST,
            user=DB_USER,
            password=DB_PASSWORD,
            database=DB_NAME
        )
        
        cursor = connection.cursor()
        
        # Check if column already exists
        cursor.execute("""
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'is_active'
        """)
        
        if cursor.fetchone():
            print("✓ Column 'is_active' already exists in users table")
        else:
            print("Adding 'is_active' column to users table...")
            # Add the column with default value True
            cursor.execute("""
                ALTER TABLE users 
                ADD COLUMN is_active TINYINT(1) DEFAULT 1 
                AFTER is_admin
            """)
            connection.commit()
            print("✓ Successfully added 'is_active' column")
            
            # Set all existing users as active
            cursor.execute("UPDATE users SET is_active = 1")
            connection.commit()
            print(f"✓ Set {cursor.rowcount} existing users as active")
        
        cursor.close()
        connection.close()
        print("\n✓ Migration completed successfully!")
        
    except Error as err:
        print(f"Error: {err}")
        return False
    
    return True

if __name__ == "__main__":
    run_migration()
