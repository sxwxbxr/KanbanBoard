CREATE TABLE IF NOT EXISTS columns (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  position INTEGER NOT NULL,
  wip_limit INTEGER,
  hidden BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  division TEXT NOT NULL,
  priority TEXT NOT NULL,
  start_date DATE,
  due_date DATE,
  column_id TEXT REFERENCES columns(id) ON DELETE CASCADE,
  position INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS email_attachments (
  id SERIAL PRIMARY KEY,
  task_id TEXT REFERENCES tasks(id) ON DELETE CASCADE,
  name TEXT NOT NULL
);
