# pyrefly: ignore [missing-import]
import pytest

@pytest.mark.asyncio
async def test_create_task_empty_title_returns_400(client):
    response = await client.post("/api/tasks", json={"column_id": 1, "title": ""})
    assert response.status_code == 400
    assert "error" in response.json()

    response = await client.post("/api/tasks", json={"column_id": 1, "title": "   "})
    assert response.status_code == 400
    assert "error" in response.json()

@pytest.mark.asyncio
async def test_move_task_updates_column(client):
    response = await client.post("/api/tasks", json={"column_id": 1, "title": "Move me", "priority": "Low"})
    assert response.status_code == 201
    task_id = response.json()["id"]

    patch_response = await client.patch(f"/api/tasks/{task_id}/move", json={"column_id": 2, "position": 0})
    assert patch_response.status_code == 200

    board_response = await client.get("/api/boards/1")
    assert board_response.status_code == 200
    board_data = board_response.json()
    
    col_1_tasks = next(c["tasks"] for c in board_data["columns"] if c["id"] == 1)
    col_2_tasks = next(c["tasks"] for c in board_data["columns"] if c["id"] == 2)

    assert any(t["id"] == task_id for t in col_2_tasks)
    assert not any(t["id"] == task_id for t in col_1_tasks)
