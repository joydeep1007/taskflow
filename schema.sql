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
