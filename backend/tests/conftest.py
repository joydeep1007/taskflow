
import os
# pyrefly: ignore [missing-import]
import pytest
# pyrefly: ignore [missing-import]
import pytest_asyncio 
# pyrefly: ignore [missing-import]
import aiosqlite 
# pyrefly: ignore [missing-import]
from httpx import AsyncClient, ASGITransport 

from app.main import app
from app.db.database import get_db

@pytest_asyncio.fixture
async def db():
    async with aiosqlite.connect(":memory:") as db:
        db.row_factory = aiosqlite.Row
        await db.execute("PRAGMA foreign_keys = ON")

        schema_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "schema.sql"))
        with open(schema_path, "r") as f:
            schema_sql = f.read()
        await db.executescript(schema_sql)

        # Seed data
        await db.execute("INSERT INTO boards (id, name) VALUES (1, 'Test Board')")
        await db.execute("INSERT INTO columns (id, board_id, name, position) VALUES (1, 1, 'To Do', 0)")
        await db.execute("INSERT INTO columns (id, board_id, name, position) VALUES (2, 1, 'In Progress', 1)")
        
        await db.execute("INSERT INTO tasks (column_id, title, priority, position) VALUES (1, 'Task 1', 'Medium', 0)")
        await db.execute("INSERT INTO tasks (column_id, title, priority, position) VALUES (1, 'Task 2', 'High', 1)")
        await db.execute("INSERT INTO tasks (column_id, title, priority, position) VALUES (1, 'Task 3', 'Low', 2)")
        await db.execute("INSERT INTO tasks (column_id, title, priority, position) VALUES (2, 'Task 4', 'Medium', 0)")
        
        await db.commit()
        yield db

@pytest_asyncio.fixture
async def client(db):
    async def override_get_db():
        yield db
        
    app.dependency_overrides[get_db] = override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client
    app.dependency_overrides.clear()
