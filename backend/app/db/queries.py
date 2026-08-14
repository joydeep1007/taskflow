

# LEFT JOIN of columns and tasks, grouped by column, returning column_id, column_name, task_count. Filtered by board_id. Ordered by column position.
TASKS_PER_COLUMN = """
SELECT c.id AS column_id, c.name AS column_name, COUNT(t.id) AS task_count
FROM columns c
LEFT JOIN tasks t ON c.id = t.column_id
WHERE c.board_id = :board_id
GROUP BY c.id, c.name, c.position
ORDER BY c.position
"""

# JOIN of tasks and columns. Filtered by board_id and priority. Returns task id, title, description, priority, created_at, column_name. Ordered by created_at DESC.
TASKS_BY_PRIORITY = """
SELECT t.id, t.title, t.description, t.priority, t.created_at, c.name AS column_name
FROM tasks t
JOIN columns c ON t.column_id = c.id
WHERE c.board_id = :board_id AND t.priority = :priority
ORDER BY t.created_at DESC
"""

# --- Supporting queries used by route handlers ---

# Select all fields from boards where id = :board_id
GET_BOARD = """
SELECT * FROM boards WHERE id = :board_id
"""

# Select all from columns where board_id = :board_id, ordered by position
GET_COLUMNS_FOR_BOARD = """
SELECT * FROM columns WHERE board_id = :board_id ORDER BY position
"""

# Select all from tasks where column_id = :column_id, ordered by position
GET_TASKS_FOR_COLUMN = """
SELECT * FROM tasks WHERE column_id = :column_id ORDER BY position
"""

# Insert into tasks with column_id, title, description, priority, and automatically set position
INSERT_TASK = """
INSERT INTO tasks (column_id, title, description, priority, position)
VALUES (
    :column_id,
    :title,
    :description,
    :priority,
    (SELECT COALESCE(MAX(position), -1) + 1 FROM tasks WHERE column_id = :column_id)
)
"""

# Update title, description, priority by task id
UPDATE_TASK = """
UPDATE tasks
SET title = :title, description = :description, priority = :priority
WHERE id = :id
"""

# Update column_id and position by task id
MOVE_TASK = """
UPDATE tasks
SET column_id = :column_id, position = :position
WHERE id = :id
"""

# Delete from tasks by id
DELETE_TASK = """
DELETE FROM tasks WHERE id = :id
"""

# Select all from tasks where id = :id
GET_TASK_BY_ID = """
SELECT * FROM tasks WHERE id = :id
"""

# Select id from columns where id = :column_id
CHECK_COLUMN_EXISTS = """
SELECT id FROM columns WHERE id = :column_id
"""
