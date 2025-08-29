const STORAGE_KEY = 'kanban_board_state';

export async function loadBoard() {
  const local = window.localStorage.getItem(STORAGE_KEY);
  if (local) return JSON.parse(local);
  try {
    const res = await fetch('http://localhost:5173/board');
    if (res.ok) return res.json();
  } catch {
    // ignore network errors and fall back to initial data
  }
  return null;
}

export async function saveBoard(state: unknown) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore storage errors (e.g., quota exceeded)
  }
  try {
    await fetch('http://localhost:5173/board', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state),
    });
  } catch {
    // ignore network errors when server not reachable
  }
}
