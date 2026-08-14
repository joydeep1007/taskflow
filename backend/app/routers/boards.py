# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends, HTTPException, Query
from app.db.database import get_db
from app.db.queries import GET_BOARD, GET_COLUMNS_FOR_BOARD, TASKS_PER_COLUMN, GET_TASKS_FOR_COLUMN, TASKS_BY_PRIORITY
from app.models.schemas import BoardResponse, ColumnResponse, TaskResponse, Priority

router = APIRouter(tags=["Boards"])

@router.get("/boards/{board_id}", response_model=BoardResponse)
async def get_board(board_id: int, db = Depends(get_db)):
    # Step 1: Run GET_BOARD query
    async with db.execute(GET_BOARD, {"board_id": board_id}) as cursor:
        board_row = await cursor.fetchone()
        if not board_row:
            raise HTTPException(status_code=404, detail="Board not found")
        
    board = dict(board_row)
    
    # Step 2: Run GET_COLUMNS_FOR_BOARD to get all columns
    async with db.execute(GET_COLUMNS_FOR_BOARD, {"board_id": board_id}) as cursor:
        columns_rows = await cursor.fetchall()
    
    # Step 3: Run TASKS_PER_COLUMN to get task counts per column
    async with db.execute(TASKS_PER_COLUMN, {"board_id": board_id}) as cursor:
        counts_rows = await cursor.fetchall()
    
    task_counts = {row["column_id"]: row["task_count"] for row in counts_rows}
    
    columns = []
    # Step 4: For each column, run GET_TASKS_FOR_COLUMN
    for col_row in columns_rows:
        col = dict(col_row)
        async with db.execute(GET_TASKS_FOR_COLUMN, {"column_id": col["id"]}) as cursor:
            tasks_rows = await cursor.fetchall()
        
        # Assemble tasks for this column
        tasks = [TaskResponse(**dict(t)) for t in tasks_rows]
        
        # Step 5: task_count must come from TASKS_PER_COLUMN
        task_count = task_counts.get(col["id"], 0)
        
        columns.append(ColumnResponse(
            id=col["id"],
            name=col["name"],
            position=col["position"],
            task_count=task_count,
            tasks=tasks
        ))
        
    board["columns"] = columns
    return BoardResponse(**board)

@router.get("/boards/{board_id}/tasks")
async def get_tasks_by_priority(
    board_id: int, 
    priority: str = Query(..., description="Priority must be Low, Medium, or High"),
    db = Depends(get_db)
):
    valid_priorities = [p.value for p in Priority]
    if priority not in valid_priorities:
        raise HTTPException(status_code=400, detail="Priority must be Low, Medium, or High")
        
    async with db.execute(TASKS_BY_PRIORITY, {"board_id": board_id, "priority": priority}) as cursor:
        tasks_rows = await cursor.fetchall()
    
    return [dict(t) for t in tasks_rows]
