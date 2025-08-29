INSERT INTO columns (id, title, position, wip_limit, hidden) VALUES
  ('backlog', 'Backlog', 0, NULL, 0),
  ('todo', 'To Do', 1, NULL, 0),
  ('inprogress', 'In Progress', 2, NULL, 0),
  ('review', 'Review', 3, NULL, 0),
  ('done', 'Done', 4, NULL, 0);

INSERT INTO tasks (id, title, division, priority, start_date, due_date, column_id, position) VALUES
  ('task-1', 'Setup project structure', 'Software', 'high', '2024-04-01', '2024-04-05', 'backlog', 0),
  ('task-2', 'Create wireframes', 'Metal', 'medium', '2024-04-02', '2024-04-10', 'todo', 0),
  ('task-3', 'Implement authentication', 'Software', 'urgent', '2024-04-03', '2024-04-15', 'inprogress', 0),
  ('task-4', 'QA testing', 'Plastic', 'low', '2024-04-04', '2024-04-20', 'review', 0),
  ('task-5', 'Deployment', 'Service', 'medium', '2024-04-05', '2024-04-25', 'done', 0);

INSERT INTO email_attachments (task_id, name) VALUES
  ('task-3', 'specification.pdf'),
  ('task-5', 'deployment-notes.txt');
