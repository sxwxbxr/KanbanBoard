import dynamic from 'next/dynamic';

const KanbanBoard = dynamic(() => import('../components/kanban-board'), { ssr: false });

export default function Page() {
  return (
    <main className="flex flex-col items-start gap-4">
      <h1 className="text-2xl font-bold">Kanban Board</h1>
      <KanbanBoard />
    </main>
  );
}
