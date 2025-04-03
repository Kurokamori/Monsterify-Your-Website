import re

import requests
import psycopg2
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# Connect to PostgreSQL using environment variables
conn = psycopg2.connect(
    host='c3cj4hehegopde.cluster-czrs8kj4isg7.us-east-1.rds.amazonaws.com',
    database='ddlric7gj25lk0',
    user='u3f7f8n9i5oagn',
    password='p418204bac8531f37c1a09899ebcff52916c7dfa3467793f76cdd2563864c5b96',
    port=5432
)
cur = conn.cursor()


def fix_ability_descriptions():
    """Fix ability descriptions by replacing special characters and problematic text."""
    try:
        print("Starting to fix ability descriptions...")
        get_abilities_query = """
            SELECT name, effect
            FROM abilities
        """
        cur.execute(get_abilities_query)
        abilities = cur.fetchall()

        print(f"Found {len(abilities)} abilities to process")

        # Process each ability
        for ability in abilities:
            name, effect = ability

            if not effect:
                continue

            # Sanitize the effect text
            sanitized_effect = effect

            # Replace special apostrophes with regular quotes
            sanitized_effect = sanitized_effect.replace("'", "'").replace("'", "'")

            # Replace "Pokémon" with "Pokemon"
            sanitized_effect = re.sub(r"Pokémon", "Pokemon", sanitized_effect)

            # Update the ability in the database
            update_query = """
                UPDATE abilities
                SET effect = %s
                WHERE name = %s
            """
            cur.execute(update_query, (sanitized_effect, name))

            print(f"Updated ability: {name}")

        # Commit the changes
        conn.commit()
        print("Successfully fixed all ability descriptions")

    except Exception as e:
        print(f"Error fixing ability descriptions: {e}")
        if conn:
            conn.rollback()
    finally:
        # Close the cursor and connection
        if cur:
            cur.close()
        if conn:
            conn.close()
            print("Database connection closed")


if __name__ == "__main__":
    fix_ability_descriptions()
