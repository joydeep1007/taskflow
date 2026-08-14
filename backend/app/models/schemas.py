from enum import Enum
from typing import Optional, List
from datetime import datetime
# pyrefly: ignore [missing-import]
from pydantic import BaseModel, ConfigDict, field_validator

class Priority(str, Enum):
    Low = 'Low'
    Medium = 'Medium'
    High = 'High'

class TaskCreate(BaseModel):
    column_id: int
    title: str
    description: Optional[str] = None
    priority: Priority = Priority.Medium

    @field_validator("title")
    @classmethod
    def title_must_not_be_empty(cls, v: str) -> str:
        stripped = v.strip()
        if not stripped:
            raise ValueError("Title must not be empty")
        return stripped

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[Priority] = None

    @field_validator("title")
    @classmethod
    def title_must_not_be_empty(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            stripped = v.strip()
            if not stripped:
                raise ValueError("Title must not be empty")
            return stripped
        return v

class TaskMove(BaseModel):
    column_id: int
    position: int

class TaskResponse(BaseModel):
    id: int
    column_id: int
    title: str
    description: Optional[str] = None
    priority: Priority
    position: int
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class ColumnResponse(BaseModel):
    id: int
    name: str
    position: int
    task_count: int
    tasks: List[TaskResponse]
    
    model_config = ConfigDict(from_attributes=True)

class BoardResponse(BaseModel):
    id: int
    name: str
    columns: List[ColumnResponse]
    
    model_config = ConfigDict(from_attributes=True)
