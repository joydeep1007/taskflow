# pyrefly: ignore [missing-import]
import pytest
from app.db.queries import TASKS_PER_COLUMN

@pytest.mark.asyncio
async def test_tasks_per_column_returns_correct_counts(db):
    async with db.execute(TASKS_PER_COLUMN, {"board_id": 1}) as cursor:
        rows = await cursor.fetchall()
        
    assert len(rows) == 2
    
    for row in rows:
        if row["column_name"] == "To Do":
            assert row["task_count"] == 3
        elif row["column_name"] == "In Progress":
            assert row["task_count"] == 1
