# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends, HTTPException, status
from app.db.database import get_db
from app.db.queries import CHECK_COLUMN_EXISTS, INSERT_TASK, GET_TASK_BY_ID, UPDATE_TASK, MOVE_TASK, DELETE_TASK
from app.models.schemas import TaskCreate, TaskUpdate, TaskMove, TaskResponse

router = APIRouter(tags=["Tasks"])

@router.post("/tasks", status_code=status.HTTP_201_CREATED, response_model=TaskResponse)
async def create_task(task: TaskCreate, db = Depends(get_db)):
    async with db.execute(CHECK_COLUMN_EXISTS, {"column_id": task.column_id}) as cursor:
        row = await cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Column not found")
        
    async with db.execute(INSERT_TASK, {
        "column_id": task.column_id,
        "title": task.title,
        "description": task.description,
        "priority": task.priority.value
    }) as cursor:
        task_id = cursor.lastrowid
        
    await db.commit()
    
    async with db.execute(GET_TASK_BY_ID, {"id": task_id}) as cursor:
        task_row = await cursor.fetchone()
    
    return dict(task_row)

@router.patch("/tasks/{task_id}", response_model=TaskResponse)
async def update_task(task_id: int, task_update: TaskUpdate, db = Depends(get_db)):
    async with db.execute(GET_TASK_BY_ID, {"id": task_id}) as cursor:
        task_row = await cursor.fetchone()
        if not task_row:
            raise HTTPException(status_code=404, detail="Task not found")
        
    existing_task = dict(task_row)
    
    # Merge values
    new_title = task_update.title if task_update.title is not None else existing_task["title"]
    new_description = task_update.description if task_update.description is not None else existing_task["description"]
    new_priority = task_update.priority.value if task_update.priority is not None else existing_task["priority"]
    
    await db.execute(UPDATE_TASK, {
        "id": task_id,
        "title": new_title,
        "description": new_description,
        "priority": new_priority
    })
    await db.commit()
    
    async with db.execute(GET_TASK_BY_ID, {"id": task_id}) as cursor:
        updated_row = await cursor.fetchone()
    
    return dict(updated_row)

@router.patch("/tasks/{task_id}/move", response_model=TaskResponse)
async def move_task(task_id: int, task_move: TaskMove, db = Depends(get_db)):
    async with db.execute(GET_TASK_BY_ID, {"id": task_id}) as cursor:
        task_row = await cursor.fetchone()
        if not task_row:
            raise HTTPException(status_code=404, detail="Task not found")
        
    async with db.execute(CHECK_COLUMN_EXISTS, {"column_id": task_move.column_id}) as cursor:
        col_row = await cursor.fetchone()
        if not col_row:
            raise HTTPException(status_code=404, detail="Column not found")
        
    await db.execute(MOVE_TASK, {
        "id": task_id,
        "column_id": task_move.column_id,
        "position": task_move.position
    })
    await db.commit()
    
    async with db.execute(GET_TASK_BY_ID, {"id": task_id}) as cursor:
        updated_row = await cursor.fetchone()
    
    return dict(updated_row)

@router.delete("/tasks/{task_id}")
async def delete_task(task_id: int, db = Depends(get_db)):
    async with db.execute(GET_TASK_BY_ID, {"id": task_id}) as cursor:
        row = await cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Task not found")
        
    await db.execute(DELETE_TASK, {"id": task_id})
    await db.commit()
    
    return {"message": "Task deleted"}
