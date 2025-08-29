IF OBJECT_ID('columns', 'U') IS NULL
BEGIN
  CREATE TABLE columns (
    id NVARCHAR(255) NOT NULL PRIMARY KEY,
    title NVARCHAR(255) NOT NULL,
    position INT NOT NULL,
    wip_limit INT NULL,
    hidden BIT DEFAULT 0
  );
END;

IF OBJECT_ID('tasks', 'U') IS NULL
BEGIN
  CREATE TABLE tasks (
    id NVARCHAR(255) NOT NULL PRIMARY KEY,
    title NVARCHAR(255) NOT NULL,
    division NVARCHAR(255) NOT NULL,
    priority NVARCHAR(50) NOT NULL,
    start_date DATE NULL,
    due_date DATE NULL,
    column_id NVARCHAR(255) NOT NULL,
    position INT NOT NULL,
    CONSTRAINT FK_tasks_columns FOREIGN KEY (column_id) REFERENCES columns(id) ON DELETE CASCADE
  );
END;

IF OBJECT_ID('email_attachments', 'U') IS NULL
BEGIN
  CREATE TABLE email_attachments (
    id INT IDENTITY(1,1) PRIMARY KEY,
    task_id NVARCHAR(255) NOT NULL,
    name NVARCHAR(255) NOT NULL,
    CONSTRAINT FK_attachments_tasks FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
  );
END;
