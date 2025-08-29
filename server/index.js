/* eslint-env node */
import express from 'express';
import cors from 'cors';
import { readFileSync } from 'fs';
import { Pool } from 'pg';

const pool = new Pool({
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'postgres',
  host: process.env.PGHOST || 'localhost',
  port: Number(process.env.PGPORT) || 5432,
  database: process.env.PGDATABASE || 'kanban',
});

async function init() {
  const schema = readFileSync(new URL('./schema.sql', import.meta.url), 'utf8');
  await pool.query(schema);
}
init().catch((err) => console.error('DB init failed', err));

const app = express();
app.use(cors());
app.use(express.json());

app.get('/board', async (req, res) => {
  try {
    const { rows: columnRows } = await pool.query(
      'SELECT id, title FROM columns ORDER BY position',
    );
    const { rows: taskRows } = await pool.query(
      'SELECT * FROM tasks ORDER BY position',
    );
    const { rows: attachmentRows } = await pool.query(
      'SELECT task_id, name FROM email_attachments',
    );

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
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM email_attachments');
    await client.query('DELETE FROM tasks');
    await client.query('DELETE FROM columns');

    for (let i = 0; i < columnOrder.length; i++) {
      const colId = columnOrder[i];
      const col = columns[colId];
      await client.query(
        'INSERT INTO columns(id, title, position) VALUES($1,$2,$3)',
        [colId, col.title, i],
      );
      const taskIds = col.taskIds;
      for (let j = 0; j < taskIds.length; j++) {
        const task = tasks[taskIds[j]];
        await client.query(
          'INSERT INTO tasks(id, title, division, priority, start_date, due_date, column_id, position) VALUES($1,$2,$3,$4,$5,$6,$7,$8)',
          [
            task.id,
            task.title,
            task.division,
            task.priority,
            task.startDate,
            task.dueDate,
            colId,
            j,
          ],
        );
        if (task.emails) {
          for (const email of task.emails) {
            await client.query(
              'INSERT INTO email_attachments(task_id, name) VALUES($1,$2)',
              [task.id, email.name],
            );
          }
        }
      }
    }

    await client.query('COMMIT');
    res.sendStatus(200);
  } catch (e) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: e.message });
  } finally {
    client.release();
  }
});

const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`server on ${port}`));
