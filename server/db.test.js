/* eslint-env node */
// @vitest-environment node
import { spawn } from 'child_process';
import { expect, test } from 'vitest';

const PORT = process.env.TEST_SERVER_PORT || '4001';
let server;

function startServer() {
  return new Promise((resolve, reject) => {
    server = spawn('node', ['server/index.js'], {
      env: { ...process.env, PORT },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const onData = (data) => {
      if (data.toString().includes(`server on ${PORT}`)) {
        server.stdout.off('data', onData);
        resolve();
      }
    };
    server.stdout.on('data', onData);
    server.on('error', reject);
  });
}

function stopServer() {
  return new Promise((resolve) => {
    if (!server) return resolve();
    server.kill();
    server.on('exit', () => {
      server = undefined;
      resolve();
    });
  });
}

const hasDbConfig =
  process.env.DB_HOST &&
  process.env.DB_USER &&
  process.env.DB_PASSWORD &&
  process.env.DB_DATABASE;

const board = {
  tasks: {
    t1: {
      id: 't1',
      title: 'Integration Test',
      division: 'Software',
      priority: 'High',
      startDate: '2024-01-01',
      dueDate: '2024-01-05',
      emails: [{ name: 'mail.eml' }],
    },
  },
  columns: {
    c1: { id: 'c1', title: 'Todo', taskIds: ['t1'] },
  },
  columnOrder: ['c1'],
};

const run = hasDbConfig ? test : test.skip;

run('persists board data to the database', async () => {
  await startServer();
  let res = await fetch(`http://localhost:${PORT}/board`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(board),
  });
  expect(res.status).toBe(200);
  await stopServer();

  await startServer();
  res = await fetch(`http://localhost:${PORT}/board`);
  expect(res.status).toBe(200);
  const data = await res.json();
  await stopServer();
  expect(data).toEqual(board);
});
