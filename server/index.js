/* eslint-env node */
import express from 'express';
import cors from 'cors';
import mssql from 'mssql';

const config = {
  user: process.env.MSSQL_USER || 'sa',
  password: process.env.MSSQL_PASSWORD || '1234',
  server: process.env.MSSQL_SERVER || 'localhost\\SQLEXPRESS',
  database: process.env.MSSQL_DB || 'KanbanBoard',
  options: {
    trustServerCertificate: true,
  },
};

const pool = new mssql.ConnectionPool(config);
const poolConnect = pool.connect();

async function init() {
  await poolConnect;
  const request = pool.request();
  await request.query(`
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='BoardState' and xtype='U')
    CREATE TABLE BoardState (id INT IDENTITY(1,1) PRIMARY KEY, state NVARCHAR(MAX))
  `);
}
init().catch((err) => console.error('DB init failed', err));

const app = express();
app.use(cors());
app.use(express.json());

app.get('/board', async (req, res) => {
  try {
    await poolConnect;
    const result = await pool
      .request()
      .query('SELECT TOP 1 state FROM BoardState ORDER BY id DESC');
    const row = result.recordset[0];
    res.json(row?.state ? JSON.parse(row.state) : null);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/board', async (req, res) => {
  try {
    const data = JSON.stringify(req.body);
    await poolConnect;
    const request = pool.request();
    await request
      .input('state', mssql.NVarChar, data)
      .query('INSERT INTO BoardState(state) VALUES(@state)');
    res.sendStatus(200);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`server on ${port}`));
