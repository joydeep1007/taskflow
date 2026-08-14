import asyncio
# pyrefly: ignore [missing-import]
import aiosqlite
from datetime import datetime, timedelta
from app.db.database import init_db, DB_PATH

async def seed():
    await init_db()
    
    async with aiosqlite.connect(DB_PATH) as db:
        # Check if already seeded
        cursor = await db.execute("SELECT id FROM boards WHERE name = 'TaskFlow Demo Board'")
        board = await cursor.fetchone()
        if board:
            print("Database already seeded.")
            return

        # Insert board
        cursor = await db.execute(
            "INSERT INTO boards (name) VALUES (?)",
            ("TaskFlow Demo Board",)
        )
        board_id = cursor.lastrowid

        # Insert columns
        columns_data = [
            (board_id, "To Do", 0),
            (board_id, "In Progress", 1),
            (board_id, "Done", 2)
        ]
        await db.executemany(
            "INSERT INTO columns (board_id, name, position) VALUES (?, ?, ?)",
            columns_data
        )
        
        # Get column IDs
        cursor = await db.execute("SELECT id, name FROM columns WHERE board_id = ? ORDER BY position", (board_id,))
        columns = await cursor.fetchall()
        col_map = {name: col_id for col_id, name in columns}

        now = datetime.now()
        
        # Insert tasks
        # "To Do": "Design database schema" (High), "Set up project scaffold" (Medium)
        # "In Progress": "Build REST API" (High), "Write seed script" (Low)
        # "Done": "Install dependencies" (Low), "Create GitHub repository" (Medium)
        tasks_data = [
            (col_map["To Do"], "Design database schema", "Create the sqlite schema", "High", 0, now - timedelta(hours=6)),
            (col_map["To Do"], "Set up project scaffold", "Initialize FastAPI app", "Medium", 1, now - timedelta(hours=5)),
            (col_map["In Progress"], "Build REST API", "Implement endpoints", "High", 0, now - timedelta(hours=4)),
            (col_map["In Progress"], "Write seed script", "Seed initial data", "Low", 1, now - timedelta(hours=3)),
            (col_map["Done"], "Install dependencies", "pip install -r requirements.txt", "Low", 0, now - timedelta(hours=2)),
            (col_map["Done"], "Create GitHub repository", "git init and push", "Medium", 1, now - timedelta(hours=1))
        ]
        
        await db.executemany(
            "INSERT INTO tasks (column_id, title, description, priority, position, created_at) VALUES (?, ?, ?, ?, ?, ?)",
            tasks_data
        )
        
        await db.commit()
        print("Seeded successfully.")

if __name__ == "__main__":
    asyncio.run(seed())
