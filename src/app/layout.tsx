import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'KanbanBoard',
  description: 'Simple Kanban Board prototype',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen p-4">{children}</body>
    </html>
  );
}
