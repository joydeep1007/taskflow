import os
# pyrefly: ignore [missing-import]
from dotenv import load_dotenv
# pyrefly: ignore [missing-import]
import aiosqlite

load_dotenv()

DB_PATH = os.environ.get("DB_PATH", "./taskflow.db")

async def get_db():
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        await db.execute("PRAGMA foreign_keys = ON")
        yield db

async def init_db():
    schema_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "schema.sql"))
    with open(schema_path, "r") as f:
        schema_sql = f.read()
    
    async with aiosqlite.connect(DB_PATH) as db:
        await db.executescript(schema_sql)
        await db.commit()
