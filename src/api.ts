export async function loadBoard() {
  const res = await fetch('http://localhost:3001/board');
  if (!res.ok) throw new Error('failed to load');
  return res.json();
}

export async function saveBoard(state: unknown) {
  await fetch('http://localhost:3001/board', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(state),
  });
}
