# TaskFlow — Product Requirements Document
### Full-Stack Take-Home Assignment · 3-Day Execution Plan

---

## 0. Meta: How to Use This PRD

This document is your single source of truth for the 3-day build. Read it top to bottom once, then use it section-by-section as you build. Constraints from the assignment brief are called out in **`⚠ CONSTRAINT`** blocks — these are the areas the evaluator explicitly said they check closely. Do not cut corners there.

---

## 1. Product Overview

**What it is:** A lightweight task board (Trello-like) for small teams. One board, multiple columns, tasks inside each column.

**What the evaluator actually cares about (priority order from the brief):**
1. Does it work end-to-end and persist data?
2. Is the database schema correct and are the two required queries real SQL?
3. Validation, error handling, small details.
4. README quality — assumptions, trade-offs, what you learned.

**What they explicitly don't care about:** Visual design polish, user auth, real-time multi-tab updates, file uploads.

---

## 2. Tech Stack Decision

| Layer | Choice | Reason |
|---|---|---|
| Frontend | React + Vite (JavaScript) | Fast setup; you know it |
| Backend | Python + FastAPI | Chosen stack; async-ready, automatic OpenAPI docs |
| Database | SQLite (via `sqlite3` stdlib) | No setup friction; brief explicitly says SQLite is fine |
| ORM/Query | Raw SQL via `sqlite3` + `aiosqlite` | Brief wants real SQL visible, not ORM magic |
| Validation | Pydantic v2 (built into FastAPI) | Request body validation is automatic and clean |
| Testing | `pytest` + `httpx` + `pytest-asyncio` | Standard FastAPI test stack |
| Drag-and-drop | `@hello-pangea/dnd` | Maintained fork of react-beautiful-dnd |
| Deployment | Render (backend) + Vercel (frontend) | Free tier; brief gives priority to deployed links |

> **`⚠ CONSTRAINT`** — The brief says "we want to see you design and query a real relational database yourself, not just call an ORM's default methods." Use raw SQL strings via Python's `sqlite3`/`aiosqlite`. Do not use SQLAlchemy ORM, Tortoise ORM, or any query-builder as the query layer. SQLAlchemy Core (raw `text()` queries) is acceptable if you prefer connection management, but the SQL must be readable in source.

---

## 3. Data Model

### 3.1 Entity Relationship

```
Board (1) ──< Column (many) ──< Task (many)
```

### 3.2 Schema — `schema.sql`

```sql
CREATE TABLE IF NOT EXISTS boards (
  id         INTEGER  PRIMARY KEY AUTOINCREMENT,
  name       TEXT     NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS columns (
  id         INTEGER  PRIMARY KEY AUTOINCREMENT,
  board_id   INTEGER  NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  name       TEXT     NOT NULL,
  position   INTEGER  NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tasks (
  id          INTEGER  PRIMARY KEY AUTOINCREMENT,
  column_id   INTEGER  NOT NULL REFERENCES columns(id) ON DELETE CASCADE,
  title       TEXT     NOT NULL CHECK(length(trim(title)) > 0),
  description TEXT,
  priority    TEXT     NOT NULL DEFAULT 'Medium'
                CHECK(priority IN ('Low', 'Medium', 'High')),
  position    INTEGER  NOT NULL DEFAULT 0,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

PRAGMA foreign_keys = ON;
```

**Key decisions to write in README:**
- `CHECK(length(trim(title)) > 0)` enforces non-empty title at DB level, not just app level
- `CHECK(priority IN (...))` enforces the enum at DB level
- `ON DELETE CASCADE` so deleting a board/column cleans up children automatically
- `position` integer on both columns and tasks enables ordered drag-and-drop
- `PRAGMA foreign_keys = ON` — SQLite does not enforce FKs by default; this must be set per connection
- SQLite chosen for zero-setup; schema logic is identical if migrated to Postgres

> **`⚠ CONSTRAINT`** — The schema file must be checked into the repo as `schema.sql` at the root level. The evaluator will read it directly. Also note: SQLite requires `PRAGMA foreign_keys = ON` to be executed on every connection — add it to your DB init code, not just the schema file.

### 3.3 The Two Required Non-Trivial Queries

These must appear as actual SQL strings in your codebase in `app/db/queries.py`:

**Query 1 — Count of tasks per column on a board:**
```sql
SELECT
  c.id          AS column_id,
  c.name        AS column_name,
  COUNT(t.id)   AS task_count
FROM columns c
LEFT JOIN tasks t ON t.column_id = c.id
WHERE c.board_id = :board_id
GROUP BY c.id, c.name
ORDER BY c.position;
```

**Query 2 — Tasks with a given priority, newest first:**
```sql
SELECT
  t.id,
  t.title,
  t.description,
  t.priority,
  t.created_at,
  c.name AS column_name
FROM tasks t
JOIN columns c ON c.id = t.column_id
WHERE c.board_id = :board_id
  AND t.priority = :priority
ORDER BY t.created_at DESC;
```

> **`⚠ CONSTRAINT`** — The brief explicitly says "show us the actual SQL, not just the JSON result." Export these as named string constants in `queries.py`. They must be readable in source — not buried in a method body or assembled via string concatenation.

### 3.4 Seed Data — `seed.py`

- 1 board: "TaskFlow Demo Board"
- 3 columns: "To Do" (position 0), "In Progress" (position 1), "Done" (position 2)
- 6 tasks spread across columns with varied priorities and `created_at` offsets (so ordering is visible)
- Seed is **idempotent**: check if board with that name exists before inserting

---

## 4. Project Structure

```
taskflow/
├── backend/
│   ├── app/
│   │   ├── db/
│   │   │   ├── __init__.py
│   │   │   ├── database.py       ← SQLite connection; PRAGMA foreign_keys = ON
│   │   │   └── queries.py        ← Named SQL string constants (required queries live here)
│   │   ├── routers/
│   │   │   ├── __init__.py
│   │   │   ├── boards.py         ← GET /boards/{id}
│   │   │   └── tasks.py          ← CRUD + move endpoints
│   │   ├── models/
│   │   │   └── schemas.py        ← Pydantic request/response models
│   │   ├── __init__.py
│   │   └── main.py               ← FastAPI app factory; mounts routers; CORS
│   ├── tests/
│   │   ├── conftest.py           ← In-memory SQLite fixture; test client setup
│   │   ├── test_tasks.py         ← API-level tests (httpx AsyncClient)
│   │   └── test_queries.py       ← DB-layer tests for the two required queries
│   ├── schema.sql                ← CREATE TABLE statements
│   ├── seed.py                   ← Idempotent seed script
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Board.jsx
│   │   │   ├── Column.jsx
│   │   │   ├── TaskCard.jsx
│   │   │   ├── TaskModal.jsx     ← Create/Edit form
│   │   │   └── FilterBar.jsx
│   │   ├── api/
│   │   │   └── client.js         ← All fetch calls centralised here
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   └── package.json
│
├── schema.sql                    ← Copy at root level for evaluator visibility
└── README.md
```

> **`⚠ CONSTRAINT`** — The brief checks for "sensible file/folder structure, meaningful names, and no leftover console.logs / debug prints." Remove all `print()` debug statements before submission. Use Python's `logging` module or FastAPI's built-in logger if you need output.

---

## 5. Backend Implementation Detail

### 5.1 Dependencies — `requirements.txt`

```
fastapi>=0.111.0
uvicorn[standard]>=0.29.0
aiosqlite>=0.20.0
pydantic>=2.0.0
pytest>=8.0.0
pytest-asyncio>=0.23.0
httpx>=0.27.0
python-dotenv>=1.0.0
```

### 5.2 Pydantic Schemas — `app/models/schemas.py`

```python
from pydantic import BaseModel, field_validator
from typing import Optional
from enum import Enum

class Priority(str, Enum):
    low = "Low"
    medium = "Medium"
    high = "High"

class TaskCreate(BaseModel):
    column_id: int
    title: str
    description: Optional[str] = None
    priority: Priority = Priority.medium

    @field_validator("title")
    @classmethod
    def title_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Title must not be empty")
        return v.strip()

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[Priority] = None

    @field_validator("title")
    @classmethod
    def title_not_empty(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and not v.strip():
            raise ValueError("Title must not be empty")
        return v.strip() if v else v

class TaskMove(BaseModel):
    column_id: int
    position: int

class TaskResponse(BaseModel):
    id: int
    column_id: int
    title: str
    description: Optional[str]
    priority: str
    position: int
    created_at: str

class ColumnResponse(BaseModel):
    id: int
    name: str
    position: int
    task_count: int
    tasks: list[TaskResponse]

class BoardResponse(BaseModel):
    id: int
    name: str
    columns: list[ColumnResponse]
```

> Pydantic validates priority against the enum automatically. FastAPI returns `422 Unprocessable Entity` for validation failures — acceptable, but add a custom exception handler to also return `400` for the title-empty case so it matches the brief's expectation of `400`.

### 5.3 Database Connection — `app/db/database.py`

```python
import aiosqlite
import os

DB_PATH = os.getenv("DB_PATH", "./taskflow.db")

async def get_db():
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        await db.execute("PRAGMA foreign_keys = ON")
        yield db
```

Use as a FastAPI dependency: `db: aiosqlite.Connection = Depends(get_db)`. The `PRAGMA foreign_keys = ON` runs on every connection — this is required because SQLite disables FK enforcement by default.

### 5.4 Named Query Constants — `app/db/queries.py`

```python
# These are the two required non-trivial queries.
# They must remain as readable SQL strings — do not inline them into route handlers.

TASKS_PER_COLUMN = """
    SELECT
      c.id        AS column_id,
      c.name      AS column_name,
      COUNT(t.id) AS task_count
    FROM columns c
    LEFT JOIN tasks t ON t.column_id = c.id
    WHERE c.board_id = :board_id
    GROUP BY c.id, c.name
    ORDER BY c.position
"""

TASKS_BY_PRIORITY = """
    SELECT
      t.id,
      t.title,
      t.description,
      t.priority,
      t.created_at,
      c.name AS column_name
    FROM tasks t
    JOIN columns c ON c.id = t.column_id
    WHERE c.board_id = :board_id
      AND t.priority = :priority
    ORDER BY t.created_at DESC
"""

# Supporting queries used by route handlers
GET_BOARD = "SELECT * FROM boards WHERE id = :board_id"

GET_COLUMNS_FOR_BOARD = """
    SELECT * FROM columns
    WHERE board_id = :board_id
    ORDER BY position
"""

GET_TASKS_FOR_COLUMN = """
    SELECT * FROM tasks
    WHERE column_id = :column_id
    ORDER BY position
"""

INSERT_TASK = """
    INSERT INTO tasks (column_id, title, description, priority, position)
    VALUES (:column_id, :title, :description, :priority,
            (SELECT COALESCE(MAX(position), -1) + 1 FROM tasks WHERE column_id = :column_id))
"""

UPDATE_TASK = """
    UPDATE tasks SET title = :title, description = :description, priority = :priority
    WHERE id = :id
"""

MOVE_TASK = "UPDATE tasks SET column_id = :column_id, position = :position WHERE id = :id"

DELETE_TASK = "DELETE FROM tasks WHERE id = :id"
```

### 5.5 FastAPI App — `app/main.py`

```python
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.routers import boards, tasks
import os

app = FastAPI(title="TaskFlow API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_URL", "*")],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(ValueError)
async def value_error_handler(request: Request, exc: ValueError):
    return JSONResponse(status_code=400, content={"error": str(exc)})

@app.exception_handler(Exception)
async def generic_error_handler(request: Request, exc: Exception):
    # Never leak stack traces to the client
    return JSONResponse(status_code=500, content={"error": "Something went wrong"})

app.include_router(boards.router, prefix="/api")
app.include_router(tasks.router, prefix="/api")
```

---

## 6. Backend API Specification

Base URL: `/api`

### 6.1 Boards

| Method | Path | Description |
|---|---|---|
| `GET` | `/boards/{id}` | Get board with all columns and tasks (nested) |
| `GET` | `/boards/{id}/tasks` | Filtered tasks by priority — uses Query 2 |

**Response shape for `GET /boards/{id}`:**
```json
{
  "id": 1,
  "name": "TaskFlow Demo Board",
  "columns": [
    {
      "id": 1,
      "name": "To Do",
      "position": 0,
      "task_count": 3,
      "tasks": [
        { "id": 1, "title": "Design schema", "priority": "High", "position": 0, "created_at": "..." }
      ]
    }
  ]
}
```

`task_count` is populated from Query 1 (a real JOIN + GROUP BY — not `len(tasks)` in Python).

### 6.2 Tasks

| Method | Path | Body | Description |
|---|---|---|---|
| `POST` | `/tasks` | `TaskCreate` | Create task |
| `PATCH` | `/tasks/{id}` | `TaskUpdate` | Edit title / description / priority |
| `PATCH` | `/tasks/{id}/move` | `TaskMove` | Move to different column / position |
| `DELETE` | `/tasks/{id}` | — | Delete task |

### 6.3 Validation Rules (backend-enforced)

- `title` empty or whitespace-only → `400 { "error": "Title must not be empty" }`
- `priority` not in `[Low, Medium, High]` → `422` (Pydantic) — document this in README
- `column_id` not found in DB → `404 { "error": "Column not found" }`
- `task_id` not found → `404 { "error": "Task not found" }`
- DB constraint violation → `500` with generic message (FK, CHECK failures caught in generic handler)

### 6.4 Error Response Shape

```json
{ "error": "Human-readable message here" }
```

All error responses use this shape. FastAPI's default `422` detail format is different — that's acceptable for schema validation but add a note in the README explaining the distinction.

---

## 7. Frontend Feature Specification

### 7.1 Board View

- On load: `GET /api/boards/1` (hardcode board ID 1 — multi-board is out of scope per brief)
- Render columns left to right in `position` order
- Each column shows: column name, task count badge (from `task_count`), list of task cards, "+ Add Task" button
- Tasks inside a column sorted by `position`

### 7.2 Task Card

Displays: title, priority badge (colour-coded: red=High, amber=Medium, green=Low), formatted creation date.
Click anywhere on the card → opens TaskModal in edit mode.
Separate delete button with `window.confirm("Delete this task?")`.

### 7.3 TaskModal (Create & Edit)

Fields:
- Title (text input, required)
- Description (textarea, optional)
- Priority (select: Low / Medium / High, default Medium)

Behaviour:
- Client-side: disable submit button if title input is empty
- On submit: `POST` or `PATCH` → on success close modal and re-fetch board state
- On API error: show inline error message inside the modal (not `window.alert`)

### 7.4 Move Task

**Primary — Drag-and-drop with `@hello-pangea/dnd`:**
- `DragDropContext` wraps the entire board
- Each column is a `Droppable`
- Each task card is a `Draggable`
- On `onDragEnd`: call `PATCH /api/tasks/{id}/move` with `{ column_id, position }`
- Optimistic update: mutate local state immediately, revert on API failure with an error banner

**Fallback — "Move to…" dropdown:**
- A select on each task card listing other columns
- On change: call same `PATCH /api/tasks/{id}/move` endpoint
- Keep this even if DnD works — it gives the evaluator an alternative to test

### 7.5 Filter Bar

- Priority toggle buttons: All / Low / Medium / High
- Client-side filtering against already-loaded board state (fast, no extra API call)
- Additionally wire `GET /api/boards/1/tasks?priority=High` for the backend filter path to demonstrate Query 2 is actually used — show the result in a "filtered view" panel or log it; note this in the README

### 7.6 API Client — `src/api/client.js`

Centralise all fetch calls here. Every function:
1. Sets `Content-Type: application/json`
2. Reads `VITE_API_URL` from env for the base URL
3. On non-2xx: reads `response.json()` and throws `new Error(data.error || "Request failed")`

This means all components catch a proper `Error` with a human-readable message — never `[object Object]`.

### 7.7 Error States

| Scenario | UI behaviour |
|---|---|
| Initial board load fails | Full-page error message with a Retry button |
| Create / Edit fails | Inline error inside the modal; modal stays open |
| Delete fails | Error banner below the column header |
| Move (DnD) fails | Revert optimistic update; show dismissable error banner at top of board |

---

## 8. Test Plan

> **`⚠ CONSTRAINT`** — The brief requires exactly these three tests at minimum. All three must pass on a clean clone.

### 8.1 Test Setup — `tests/conftest.py`

```python
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.db.database import get_db
import aiosqlite

@pytest_asyncio.fixture
async def db():
    """In-memory SQLite DB, schema applied fresh for each test."""
    async with aiosqlite.connect(":memory:") as conn:
        conn.row_factory = aiosqlite.Row
        await conn.execute("PRAGMA foreign_keys = ON")
        with open("schema.sql") as f:
            await conn.executescript(f.read())
        # Seed minimal data: 1 board, 2 columns
        await conn.execute("INSERT INTO boards (name) VALUES ('Test Board')")
        await conn.execute("INSERT INTO columns (board_id, name, position) VALUES (1, 'To Do', 0)")
        await conn.execute("INSERT INTO columns (board_id, name, position) VALUES (1, 'In Progress', 1)")
        await conn.commit()
        yield conn

@pytest_asyncio.fixture
async def client(db):
    """FastAPI test client with the in-memory DB injected."""
    async def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c
    app.dependency_overrides.clear()
```

### 8.2 Required Tests

**File: `tests/test_tasks.py`**

```
Test 1: POST /api/tasks with no title returns 400
  - POST { "column_id": 1, "title": "" }
  - Assert status_code == 400
  - Assert "error" in response.json()
  - Assert "title" in response.json()["error"].lower()

  Also test whitespace-only title:
  - POST { "column_id": 1, "title": "   " }
  - Assert status_code == 400

Test 2: PATCH /api/tasks/{id}/move updates the task's column
  - POST a task into column 1 → get task id from response
  - PATCH /api/tasks/{id}/move with { "column_id": 2, "position": 0 }
  - Assert status_code == 200
  - GET /api/boards/1
  - Assert the task appears in column 2's tasks list
  - Assert the task does NOT appear in column 1's tasks list
```

**File: `tests/test_queries.py`**

```
Test 3: TASKS_PER_COLUMN query returns correct counts for known data
  - Insert 3 tasks into column 1, 1 task into column 2 (directly via db fixture)
  - Execute TASKS_PER_COLUMN query with board_id=1
  - Assert result has 2 rows
  - Assert the row for "To Do" has task_count == 3
  - Assert the row for "In Progress" has task_count == 1
```

### 8.3 Running Tests

```bash
cd backend
pytest tests/ -v
```

Add `pytest.ini` or `pyproject.toml` with:
```ini
[pytest]
asyncio_mode = auto
```

---

## 9. Deployment Plan

| Service | What | Config |
|---|---|---|
| Render (free) | FastAPI via Uvicorn | Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
| Vercel | React frontend | `VITE_API_URL` env var pointing to Render URL |

**SQLite persistence on Render:**
- Use Render's persistent disk (free 1GB) mounted at e.g. `/var/data`
- Set env var `DB_PATH=/var/data/taskflow.db`
- `database.py` reads `os.getenv("DB_PATH", "./taskflow.db")`
- Render start command: `python seed.py && uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Seed script is idempotent (checks if board exists) so running it on every start is safe

**CORS:**
- Set `FRONTEND_URL=https://your-app.vercel.app` in Render env vars
- `main.py` reads this and passes to `CORSMiddleware`

**Render `render.yaml` (optional but clean):**
```yaml
services:
  - type: web
    name: taskflow-api
    runtime: python
    buildCommand: pip install -r requirements.txt
    startCommand: python seed.py && uvicorn app.main:app --host 0.0.0.0 --port $PORT
    envVars:
      - key: DB_PATH
        value: /var/data/taskflow.db
      - key: FRONTEND_URL
        sync: false
    disk:
      name: taskflow-data
      mountPath: /var/data
      sizeGB: 1
```

---

## 10. README Structure

The evaluator reads this section carefully. Write it last, but write it properly.

```markdown
## TaskFlow

### Live Demo
- Frontend: https://taskflow-xxx.vercel.app
- API docs: https://taskflow-api.onrender.com/docs  ← FastAPI gives you this for free

### Setup (local)

**Backend**
cd backend
python -m venv venv && source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
python seed.py
uvicorn app.main:app --reload --port 8000

**Frontend**
cd frontend
npm install
echo "VITE_API_URL=http://localhost:8000" > .env
npm run dev

### Schema
(paste schema.sql here with a one-line comment per table)

### Key Queries
(paste TASKS_PER_COLUMN and TASKS_BY_PRIORITY with a one-line explanation each)

### Decisions & Assumptions
- Used SQLite for zero setup; schema is Postgres-compatible with minor type changes
- Board ID hardcoded to 1 — multi-board is out of scope per brief
- PRAGMA foreign_keys = ON is set on every connection (SQLite doesn't enable it by default)
- Drag-and-drop uses optimistic updates — reverts on API failure
- Position uses integer gaps; no reindex on delete (gaps are harmless for ordering)
- FastAPI's automatic /docs endpoint exposes the full API — useful for evaluator review
- Pydantic validation returns 422 for schema errors; title-empty case returns 400 via custom handler

### Trade-offs & What I'd Improve
- Replace SQLite with Postgres + asyncpg for production concurrency
- Use fractional indexing for task positions to avoid O(n) reorders on every drag
- Add React Query for proper server-state caching instead of manual refetch
- Add rate limiting (slowapi) and request size limits
- The persistent disk on Render free tier is fine for demo; real production would use Postgres

### Time Spent
~X hours: Y backend, Z frontend, W tests, V deployment

### One Thing I Found Interesting
(Write something genuine — evaluators read this. e.g. why SQLite needs PRAGMA foreign_keys = ON,
or how FastAPI generates OpenAPI docs from Pydantic models automatically)
```

> **Tip:** The FastAPI `/docs` URL is a free bonus — mention it in the README and submission message. The evaluator can explore your entire API interactively without Postman.

---

## 11. Day-by-Day Execution Plan

### Day 1 — Backend complete

| Time | Task |
|---|---|
| 0–0.5h | Scaffold: `python -m venv venv`, install requirements, `git init` |
| 0.5–1.5h | Write `schema.sql`, `database.py`, `seed.py`. Run seed. Verify with DB Browser for SQLite |
| 1.5–2.5h | Write `queries.py` with all named SQL constants. Test Query 1 + 2 manually in Python REPL |
| 2.5–4h | Write `schemas.py` (Pydantic models). Write `routers/boards.py` and `routers/tasks.py` |
| 4–5h | Wire everything in `main.py`. Smoke test all endpoints via `/docs` UI |
| 5–6h | Write `conftest.py`. Write the 3 required tests. `pytest -v` all passing |

**End of Day 1 checkpoint:** `curl http://localhost:8000/api/boards/1` returns full nested JSON. `pytest` is green.

### Day 2 — Frontend complete

| Time | Task |
|---|---|
| 0–1h | Scaffold Vite React app. Write `api/client.js` with base URL, error handling, all fetch functions |
| 1–2h | `Board.jsx` + `Column.jsx`. Fetch and render seed data from API |
| 2–4h | `TaskCard.jsx` + `TaskModal.jsx` (create + edit). Connect to API. Validate empty title client-side |
| 4–5.5h | Drag-and-drop with `@hello-pangea/dnd`. Wire `onDragEnd` to move endpoint. Add fallback dropdown |
| 5.5–6h | `FilterBar.jsx`. Client-side priority filter. Wire backend filter endpoint to demonstrate Query 2 |

**End of Day 2 checkpoint:** Full board works locally. Create, edit, move, delete all persist on page reload.

### Day 3 — Polish, deploy, README

| Time | Task |
|---|---|
| 0–1h | Implement all error states (failed load, failed create, move revert with banner) |
| 1–2h | Remove all `print()` debug statements. Code review: names, structure, dead code |
| 2–3.5h | Deploy backend to Render. Deploy frontend to Vercel. Smoke test the live URL end-to-end |
| 3.5–5h | Write README. Write the "decisions" and "one thing I found interesting" sections properly |
| 5–6h | Buffer: fresh clone → follow own README → verify everything works from scratch |

---

## 12. Common Pitfalls to Avoid

1. **`PRAGMA foreign_keys = ON` missing** — SQLite silently ignores FK violations without it. Set it in `get_db()`, not just `schema.sql`. Tests will catch this if you try to insert a task with a non-existent `column_id`.

2. **`aiosqlite.Row` not set as `row_factory`** — Without it, rows are plain tuples, not dict-like objects. Set `db.row_factory = aiosqlite.Row` in `get_db()`.

3. **CORS on Render cold start** — Free Render services sleep after 15 minutes of inactivity. The first request takes ~30 seconds. Mention this in the README so the evaluator doesn't think the API is down.

4. **Empty title with spaces** — `"   "` must fail. Pydantic `field_validator` with `.strip()` handles this. The DB `CHECK(length(trim(title)) > 0)` is a second line of defense.

5. **Pydantic 422 vs 400** — FastAPI returns `422` for body validation failures by default. The brief expects `400` for empty title. Add a custom `RequestValidationError` handler in `main.py` that returns `400` for this case, or handle it explicitly in the route.

6. **Test DB isolation** — `conftest.py` must use `:memory:` and apply the schema fresh for each test. Never point tests at the development `taskflow.db`.

7. **Drag-and-drop position sync** — On `onDragEnd`, recalculate `position` for all tasks in the affected columns based on their new index in the array. Send a single `PATCH /move` call with the final `position` value, not multiple updates.

8. **SQLite on Render persistent disk** — If you forget to set `DB_PATH` to the mounted disk path, the `.db` file is written to the ephemeral filesystem and resets on every redeploy. Verify by creating a task, triggering a redeploy, and checking it survived.

9. **FastAPI startup event for DB init** — Optionally add a `lifespan` startup event in `main.py` that runs `schema.sql` on startup. This way a fresh deploy self-initialises without needing to run `seed.py` separately.

---

## 13. Stretch Goal Recommendation

If core is fully done by mid-Day 3: implement **task count per column in the column header**. It's the fastest stretch goal and directly showcases Query 1 in the UI — the evaluator can see the `GROUP BY` result rendered as a badge. One badge component, `task_count` is already in the API response. Done in under 30 minutes.

Do not attempt text search if it means rushing the error states or README.

---

## 14. Scoring Self-Check (run before submission)

- [ ] Fresh clone → follow own README → both frontend and backend start cleanly
- [ ] `POST /api/tasks` with `{ "column_id": 1, "title": "" }` → returns `400`
- [ ] `POST /api/tasks` with `{ "column_id": 1, "title": "   " }` → returns `400`
- [ ] Create a task, reload the page → task is still there
- [ ] Move a task to a different column, reload → task is in the new column
- [ ] Kill the backend → frontend shows an error message, not a blank screen
- [ ] `pytest tests/ -v` → all 3 required tests pass
- [ ] `grep -r "print(" app/` → empty (no debug prints left)
- [ ] `schema.sql` exists at repo root and matches the live DB
- [ ] `queries.py` contains TASKS_PER_COLUMN and TASKS_BY_PRIORITY as readable SQL strings
- [ ] Live URL is in the README and actually works
- [ ] README "decisions & trade-offs" section is written, not placeholder text
- [ ] `/docs` endpoint on the live API is accessible and shows all routes
