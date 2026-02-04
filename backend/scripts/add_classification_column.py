"""
Migration script to add 'classification' column to the fakemon table.
Classification is a descriptive label like "The Mountain Goat Monster",
distinct from category which represents the universe (Pokemon/Digimon/etc.).

Usage: python add_classification_column.py
Requires DATABASE_URL environment variable to be set.
"""

import os
import sys

try:
    import psycopg2
except ImportError:
    print("psycopg2 not installed. Install with: pip install psycopg2-binary")
    sys.exit(1)


def main():
    database_url = os.environ.get('DATABASE_URL')

    if not database_url:
        print("ERROR: DATABASE_URL environment variable is not set.")
        print("Set it like: DATABASE_URL=postgresql://user:password@host:port/dbname")
        sys.exit(1)

    try:
        conn = psycopg2.connect(database_url)
        conn.autocommit = True
        cursor = conn.cursor()

        print("Connected to database. Adding classification column...")

        cursor.execute("""
            ALTER TABLE fakemon
            ADD COLUMN IF NOT EXISTS classification TEXT;
        """)

        print("Successfully added 'classification' column to fakemon table.")

        cursor.close()
        conn.close()

    except psycopg2.Error as e:
        print(f"Database error: {e}")
        sys.exit(1)


if __name__ == '__main__':
    main()
