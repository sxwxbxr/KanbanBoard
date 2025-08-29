/* eslint-env node */
import express from 'express';
import cors from 'cors';

import { readFileSync } from 'fs';
import sql from 'mssql';

const pool = new sql.ConnectionPool({
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || 'YourStrong!Passw0rd',
  server: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 1433,
  database: process.env.DB_DATABASE || 'kanban',
  options: { encrypt: false, trustServerCertificate: true },
});

async function init() {
  await pool.connect();
  const schema = readFileSync(new URL('./schema.sql', import.meta.url), 'utf8');
  await pool.request().batch(schema);
}
init().catch((err) => console.error('DB init failed', err));

const app = express();
app.use(cors());
app.use(express.json());

app.get('/board', async (req, res) => {
  try {

    const columnRows = (
      await pool.request().query('SELECT id, title FROM columns ORDER BY position')
    ).recordset;
    const taskRows = (
      await pool.request().query('SELECT * FROM tasks ORDER BY position')
    ).recordset;
    const attachmentRows = (
      await pool.request().query('SELECT task_id, name FROM email_attachments')
    ).recordset;

    const attachmentMap = {};
    for (const a of attachmentRows) {
      if (!attachmentMap[a.task_id]) attachmentMap[a.task_id] = [];
      attachmentMap[a.task_id].push({ name: a.name });
    }

    const tasks = {};
    for (const t of taskRows) {
      tasks[t.id] = {
        id: t.id,
        title: t.title,
        division: t.division,
        priority: t.priority,
        startDate: t.start_date,
        dueDate: t.due_date,
        emails: attachmentMap[t.id] || [],
      };
    }

    const columns = {};
    const columnOrder = [];
    for (const c of columnRows) {
      columns[c.id] = {
        id: c.id,
        title: c.title,
        taskIds: taskRows
          .filter((t) => t.column_id === c.id)
          .map((t) => t.id),
      };
      columnOrder.push(c.id);
    }

    res.json({ tasks, columns, columnOrder });

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/board', async (req, res) => {

  const { tasks, columns, columnOrder } = req.body;
  const tx = new sql.Transaction(pool);
  try {
    await tx.begin();
    await new sql.Request(tx).batch(
      'DELETE FROM email_attachments; DELETE FROM tasks; DELETE FROM columns;'
    );

    for (let i = 0; i < columnOrder.length; i++) {
      const colId = columnOrder[i];
      const col = columns[colId];
      await new sql.Request(tx)
        .input('id', sql.NVarChar, colId)
        .input('title', sql.NVarChar, col.title)
        .input('position', sql.Int, i)
        .query('INSERT INTO columns(id, title, position) VALUES (@id, @title, @position)');
      const taskIds = col.taskIds;
      for (let j = 0; j < taskIds.length; j++) {
        const task = tasks[taskIds[j]];
        await new sql.Request(tx)
          .input('id', sql.NVarChar, task.id)
          .input('title', sql.NVarChar, task.title)
          .input('division', sql.NVarChar, task.division)
          .input('priority', sql.NVarChar, task.priority)
          .input('start', sql.Date, task.startDate)
          .input('due', sql.Date, task.dueDate)
          .input('colId', sql.NVarChar, colId)
          .input('position', sql.Int, j)
          .query(
            'INSERT INTO tasks(id, title, division, priority, start_date, due_date, column_id, position) VALUES (@id,@title,@division,@priority,@start,@due,@colId,@position)'
          );
        if (task.emails) {
          for (const email of task.emails) {
            await new sql.Request(tx)
              .input('taskId', sql.NVarChar, task.id)
              .input('name', sql.NVarChar, email.name)
              .query('INSERT INTO email_attachments(task_id, name) VALUES (@taskId, @name)');
          }
        }
      }
    }

    await tx.commit();
    res.sendStatus(200);
  } catch (e) {
    await tx.rollback();

    res.status(500).json({ error: e.message });
  }
});

const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`server on ${port}`));
