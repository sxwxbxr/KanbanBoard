import { DndContext, DragEndEvent, closestCorners } from '@dnd-kit/core';
import { SortableContext, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Filter, Plus, Settings, Paperclip } from 'lucide-react';
import { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';

import { loadBoard, saveBoard } from '../api';

interface EmailAttachment {
  name: string;
}

interface Task {
  id: string;
  title: string;
  division: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  startDate?: string;
  dueDate?: string;
  emails?: EmailAttachment[];
}

interface Column {
  id: string;
  title: string;
  taskIds: string[];
}

const divisions = ['Software', 'Metal', 'Plastic', 'Service'];

const divisionColors: Record<string, string> = {
  Software: 'bg-purple-200 text-purple-700',
  Metal: 'bg-green-200 text-green-700',
  Plastic: 'bg-yellow-200 text-yellow-700',
  Service: 'bg-pink-200 text-pink-700',
};

const priorityColors: Record<Task['priority'], string> = {
  low: 'bg-gray-200 text-gray-700',
  medium: 'bg-blue-200 text-blue-700',
  high: 'bg-orange-200 text-orange-700',
  urgent: 'bg-red-200 text-red-700',
};

const initialTasks: Record<string, Task> = {
  'task-1': {
    id: 'task-1',
    title: 'Qualitätskontrolle Metallteile',
    division: 'Metal',
    priority: 'medium',
    dueDate: '2024-09-28',
  },
  'task-2': {
    id: 'task-2',
    title: 'CNC Maschine kalibrieren',
    division: 'Service',
    priority: 'high',
    emails: [{ name: 'wartung.eml' }],
  },
  'task-3': {
    id: 'task-3',
    title: 'Dashboard überarbeiten',
    division: 'Software',
    priority: 'low',
  },
};

const initialColumns: Record<string, Column> = {
  backlog: { id: 'backlog', title: 'Backlog', taskIds: [] },
  todo: { id: 'todo', title: 'Zu erledigen', taskIds: ['task-1'] },
  inprogress: {
    id: 'inprogress',
    title: 'In Bearbeitung',
    taskIds: ['task-2'],
  },
  review: { id: 'review', title: 'Review', taskIds: ['task-3'] },
  done: { id: 'done', title: 'Done', taskIds: [] },
};

const initialColumnOrder = ['backlog', 'todo', 'inprogress', 'review', 'done'];

function TaskCard({ task, onEdit }: { task: Task; onEdit: (t: Task) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: task.id, data: { type: 'task' } });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  let deadlineClass = '';
  if (task.dueDate) {
    const diff =
      (new Date(task.dueDate).getTime() - new Date().getTime()) /
      (1000 * 60 * 60 * 24);
    if (diff < 0) deadlineClass = 'border-red-500 bg-red-50';
    else if (diff <= 2) deadlineClass = 'border-orange-400 bg-orange-50';
  }
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`mb-2 cursor-pointer rounded border bg-white p-2 shadow-sm ${deadlineClass}`}
      onClick={() => onEdit(task)}
    >
      <div className="font-medium">{task.title}</div>
      <div className="mt-1 flex flex-wrap gap-1 text-xs">
        <span className={`rounded px-1 ${divisionColors[task.division]}`}>
          {task.division}
        </span>
        <span className={`rounded px-1 ${priorityColors[task.priority]}`}>
          {task.priority}
        </span>
        {task.dueDate && (
          <span className="rounded bg-gray-200 px-1 text-gray-700">
            Fällig {new Date(task.dueDate).toLocaleDateString('de-CH')}
          </span>
        )}
      </div>
      {task.emails && task.emails.length > 0 && (
        <div className="mt-1 flex items-center gap-1 text-xs text-blue-600">
          <Paperclip className="h-3 w-3" /> {task.emails.length} Mail
        </div>
      )}
    </div>
  );
}

function ColumnComponent({
  column,
  tasks,
  onEditTask,
}: {
  column: Column;
  tasks: Task[];
  onEditTask: (t: Task) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: column.id, data: { type: 'column' } });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="flex min-w-[260px] flex-1 flex-col rounded border bg-gray-50 p-4"
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">{column.title}</h2>
        <span className="text-xl text-gray-500">…</span>
      </div>
      <SortableContext items={column.taskIds}>
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} onEdit={onEditTask} />
        ))}
      </SortableContext>
      {tasks.length === 0 && (
        <div className="mt-2 text-sm text-gray-500">
          Keine Aufgaben. Ziehe Aufgaben hierher
        </div>
      )}
    </div>
  );
}

function TaskForm({
  initial,
  onSave,
  onCancel,
  onDelete,
}: {
  initial?: Task;
  onSave: (task: Task) => void;
  onCancel: () => void;
  onDelete?: (id: string) => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [division, setDivision] = useState(initial?.division ?? divisions[0]);
  const [priority, setPriority] = useState<Task['priority']>(
    initial?.priority ?? 'low',
  );
  const [startDate, setStartDate] = useState(initial?.startDate ?? '');
  const [dueDate, setDueDate] = useState(initial?.dueDate ?? '');
  const [emails, setEmails] = useState<EmailAttachment[]>(
    initial?.emails ?? [],
  );

  return (
  <div className="fixed inset-0 flex items-center justify-center bg-black/30">
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const id = initial?.id ?? `task-${Date.now()}`;
        onSave({
          id,
          title,
          division,
          priority,
          startDate: startDate || undefined,
          dueDate: dueDate || undefined,
          emails,
        });
      }}
      className="w-80 space-y-2 rounded bg-white p-4"
    >
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Titel"
        className="w-full border p-1"
        required
      />
      <select
        value={division}
        onChange={(e) => setDivision(e.target.value)}
        className="w-full border p-1"
      >
        {divisions.map((d) => (
          <option key={d}>{d}</option>
        ))}
      </select>
      <select
        value={priority}
        onChange={(e) => setPriority(e.target.value as Task['priority'])}
        className="w-full border p-1"
      >
        <option value="low">low</option>
        <option value="medium">medium</option>
        <option value="high">high</option>
        <option value="urgent">urgent</option>
      </select>
      <label className="block text-sm">Start</label>
      <input
        type="date"
        value={startDate}
        onChange={(e) => setStartDate(e.target.value)}
        className="w-full border p-1"
      />
      <label className="block text-sm">Fällig</label>
      <input
        type="date"
        value={dueDate}
        onChange={(e) => setDueDate(e.target.value)}
        className="w-full border p-1"
      />
      <div>
        <label className="block text-sm">E-Mail-Anhänge</label>
        <input
          type="file"
          multiple
          accept=".eml,.msg"
          onChange={(e) =>
            setEmails(
              Array.from(e.target.files || []).map((f) => ({ name: f.name })),
            )
          }
          className="w-full border p-1"
        />
        {emails.length > 0 && (
          <ul className="mt-1 text-xs">
            {emails.map((m) => (
              <li key={m.name}>📎 {m.name}</li>
            ))}
          </ul>
        )}
      </div>
      <div className="flex justify-end gap-2">
        {initial && onDelete && (
          <button
            type="button"
            onClick={() => onDelete(initial.id)}
            className="text-red-600"
          >
            Löschen
          </button>
        )}
        <button type="button" onClick={onCancel}>
          Abbrechen
        </button>
        <button type="submit" className="bg-blue-500 px-2 text-white">
          Speichern
        </button>
      </div>
    </form>
  </div>
  );
}

function SettingsWindow() {
  return (
    <div className="p-4">
      <h2 className="mb-4 text-lg font-semibold">Einstellungen</h2>
      <button
        className="rounded bg-blue-500 px-2 py-1 text-white"
        onClick={() => {
          const title = prompt('Spaltenname');
          if (title && window.opener) {
            window.opener.postMessage({ type: 'addColumn', title }, '*');
          }
        }}
      >
        Spalte hinzufügen
      </button>
    </div>
  );
}

function openSettingsWindow() {
  const win = window.open('', '', 'width=400,height=300');
  if (!win) return;
  win.document.title = 'Einstellungen';
  const container = win.document.createElement('div');
  win.document.body.appendChild(container);
  ReactDOM.createRoot(container).render(<SettingsWindow />);
}

export function KanbanBoard() {
  const [tasks, setTasks] = useState<Record<string, Task>>(initialTasks);
  const [columns, setColumns] = useState<Record<string, Column>>(initialColumns);
  const [columnOrder, setColumnOrder] = useState<string[]>(initialColumnOrder);
  const [editing, setEditing] = useState<Task | null>(null);
  const [filterDivision, setFilterDivision] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [search, setSearch] = useState('');

  const addColumn = (title: string) => {
    const id = `col-${Date.now()}`;
    setColumns((prev) => ({ ...prev, [id]: { id, title, taskIds: [] } }));
    setColumnOrder((prev) => [...prev, id]);
  };

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'addColumn') addColumn(e.data.title);
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  useEffect(() => {
    loadBoard()
      .then((data) => {
        if (data) {
          setTasks(data.tasks);
          setColumns(data.columns);
          setColumnOrder(data.columnOrder);
        }
      })
      .catch(() => {
        // ignore if server not available
      });
  }, []);

  useEffect(() => {
    saveBoard({ tasks, columns, columnOrder }).catch(() => {
      // ignore errors
    });
  }, [tasks, columns, columnOrder]);

  const findColumn = (taskId: string) => {
    for (const column of Object.values(columns)) {
      if (column.taskIds.includes(taskId)) {
        return column;
      }
    }
    return null;
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeType = active.data.current?.type;
    const overType = over.data.current?.type;

    if (activeType === 'column' && overType === 'column') {
      const oldIndex = columnOrder.indexOf(active.id as string);
      const newIndex = columnOrder.indexOf(over.id as string);
      setColumnOrder(arrayMove(columnOrder, oldIndex, newIndex));
      return;
    }

    if (activeType === 'task') {
      const sourceColumn = findColumn(active.id as string);
      const destinationColumn =
        findColumn(over.id as string) || columns[over.id as string];
      if (!sourceColumn || !destinationColumn) return;

      if (sourceColumn.id === destinationColumn.id) {
        const oldIndex = sourceColumn.taskIds.indexOf(active.id as string);
        const newIndex = sourceColumn.taskIds.indexOf(over.id as string);
        sourceColumn.taskIds = arrayMove(
          sourceColumn.taskIds,
          oldIndex,
          newIndex,
        );
        setColumns({ ...columns, [sourceColumn.id]: sourceColumn });
      } else {
        const fromIndex = sourceColumn.taskIds.indexOf(active.id as string);
        sourceColumn.taskIds.splice(fromIndex, 1);
        const overIndex = destinationColumn.taskIds.indexOf(over.id as string);
        const insertAt =
          overIndex === -1 ? destinationColumn.taskIds.length : overIndex;
        destinationColumn.taskIds.splice(insertAt, 0, active.id as string);
        setColumns({
          ...columns,
          [sourceColumn.id]: sourceColumn,
          [destinationColumn.id]: destinationColumn,
        });
      }
    }
  };

  const handleSaveTask = (task: Task) => {
    setTasks((prev) => ({ ...prev, [task.id]: task }));
    if (!initialTasks[task.id] && !columns.todo.taskIds.includes(task.id)) {
      // new task goes to first column
      const first = columnOrder[0];
      setColumns((prev) => ({
        ...prev,
        [first]: { ...prev[first], taskIds: [...prev[first].taskIds, task.id] },
      }));
    }
    setEditing(null);
  };

  const handleDeleteTask = (id: string) => {
    const newTasks = { ...tasks };
    delete newTasks[id];
    const newColumns = { ...columns };
    for (const col of Object.values(newColumns)) {
      col.taskIds = col.taskIds.filter((tid) => tid !== id);
    }
    setTasks(newTasks);
    setColumns(newColumns);
    setEditing(null);
  };

  return (
    <DndContext collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Kanban Board</h1>
        <div className="flex items-center gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Suchen..."
            className="rounded border px-2 py-1"
          />
          <button
            className="flex items-center gap-1 rounded border px-2 py-1"
            onClick={() => setShowFilters((v) => !v)}
          >
            <Filter className="h-4 w-4" /> Filter
          </button>
          <button
            className="flex items-center gap-1 rounded bg-blue-600 px-3 py-1 text-white"
            onClick={() =>
              setEditing({
                id: '',
                title: '',
                division: divisions[0],
                priority: 'low',
                emails: [],
              })
            }
          >
            <Plus className="h-4 w-4" /> Neu (N)
          </button>
          <button
            className="rounded border p-2"
            onClick={openSettingsWindow}
            aria-label="Einstellungen"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>
      {showFilters && (
        <div className="mb-4 flex gap-2">
          <select
            value={filterDivision}
            onChange={(e) => setFilterDivision(e.target.value)}
            className="border p-1"
          >
            <option value="">Alle Abt.</option>
            {divisions.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="border p-1"
          >
            <option value="">Alle Prior.</option>
            <option value="low">low</option>
            <option value="medium">medium</option>
            <option value="high">high</option>
            <option value="urgent">urgent</option>
          </select>
        </div>
      )}
      <SortableContext items={columnOrder}>
        <div className="flex w-full gap-4 overflow-x-auto">
          {columnOrder.map((columnId) => {
            const column = columns[columnId];
            const taskList = column.taskIds
              .map((id) => tasks[id])
              .filter((t) => t && (!filterDivision || t.division === filterDivision))
              .filter((t) => t && (!filterPriority || t.priority === filterPriority))
              .filter((t) => t && t.title.toLowerCase().includes(search.toLowerCase()));
            return (
              <ColumnComponent
                key={column.id}
                column={column}
                tasks={taskList}
                onEditTask={(t) => setEditing(t)}
              />
            );
          })}
        </div>
      </SortableContext>
      {editing && (
        <TaskForm
          initial={editing.id ? editing : undefined}
          onSave={handleSaveTask}
          onCancel={() => setEditing(null)}
          onDelete={handleDeleteTask}
        />
      )}
    </DndContext>
  );
}
