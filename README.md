# TaskFlow

### Live Demo

- Frontend: [TaskFlow](https://taskflowjoy.vercel.app/)
- API docs: [TaskFlow API](https://taskflow-wy3r.onrender.com/docs)

### Setup (local)

**Backend Setup:**

```bash
# 1. Navigate to the backend folder
cd backend

# 2. Create and activate a virtual environment
python -m venv venv
# On Windows: venv\Scripts\activate
# On Mac/Linux: source venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Initialize the database and run the seed script
python seed.py

# 5. Start the FastAPI server
uvicorn app.main:app --reload --port 8000
```

**Frontend Setup:**

```bash
# 1. Open a new terminal and navigate to the frontend folder
cd frontend

# 2. Install Node dependencies
npm install

# 3. Create a .env file linking to the local backend
echo "VITE_API_URL=http://localhost:8000" > .env
# (If using PowerShell on Windows, you might just need to manually create .env and add: VITE_API_URL=http://localhost:8000)

# 4. Start the Vite development server
npm run dev
```

### Notes & Reflections

#### 1. Decisions & Assumptions

I kept the first version focused on the core requirements from the brief rather than adding features that weren't necessary. I chose SQLite because it was allowed in the assignment and made the project simple to set up and run without requiring a separate database server. I also enabled `PRAGMA foreign_keys = ON` for every database connection so that the foreign-key relationships and `ON DELETE CASCADE` behaviour work correctly.

I treated the application as a single-board task board and used Board ID 1 on the frontend because multi-board management and user accounts were outside the scope of the assignment. For moving tasks, I used drag-and-drop since it was one of the suggested interaction options. I kept task ordering as a simple integer position value because it was sufficient for the size and scope of this project.

I also made the seed script idempotent so it could be run multiple times without unnecessarily creating duplicate seed data. For validation, I handled the important rules on the backend rather than relying only on frontend validation, so the API remains responsible for maintaining valid data.

#### 2. What I'd Improve With More Time

If I had more time, I'd first consider moving from SQLite to PostgreSQL for a more production-oriented setup, especially if the application needed to support more concurrent users.

I'd also add task-title search, which was mentioned as a nice-to-have in the brief, and improve the frontend's loading and error states so users get clearer feedback while data is being loaded or when an API request fails.

There are also a few smaller usability improvements I'd like to make, such as showing a confirmation before deleting a task, displaying clearer empty states when a column has no tasks, and providing better feedback after creating or updating a task.

#### 3. Time Spent

I spent roughly 5–6 hours on the project in total. Most of the time went into implementing and testing the backend, followed by the frontend and drag-and-drop functionality. I also spent time debugging issues, verifying the API through Swagger, testing the application end-to-end, and getting the project deployed.

#### 4. Something I Learned

One thing I found genuinely interesting was that SQLite doesn't enforce foreign-key constraints by default. I initially assumed that defining the foreign keys and `ON DELETE CASCADE` in the schema would be enough, but I learned that foreign-key enforcement needs to be enabled for each SQLite connection. This led me to explicitly run `PRAGMA foreign_keys = ON` whenever a database connection is created.

I also found FastAPI's integration with Pydantic and OpenAPI useful during development. Having the `/docs` interface generated automatically made it much easier to test the endpoints and verify different request and response cases while building the backend.

### Schema

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
```
