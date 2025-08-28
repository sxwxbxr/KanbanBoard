import { DndContext, DragEndEvent, closestCorners } from '@dnd-kit/core';
import { SortableContext, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useEffect, useState } from 'react';

import { loadBoard, saveBoard } from '../api';

interface Task {
  id: string;
  title: string;
  division: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  startDate?: string;
  dueDate?: string;
  emails?: string[];
}

interface Column {
  id: string;
  title: string;
  taskIds: string[];
}

const divisions = ['Software', 'Metal', 'Plastic', 'Service'];

const initialTasks: Record<string, Task> = {
  'task-1': {
    id: 'task-1',
    title: 'First task',
    division: 'Software',
    priority: 'low',
  },
  'task-2': {
    id: 'task-2',
    title: 'Second task',
    division: 'Metal',
    priority: 'medium',
    dueDate: '2024-08-30',
  },
  'task-3': {
    id: 'task-3',
    title: 'Third task',
    division: 'Plastic',
    priority: 'high',
  },
};

const initialColumns: Record<string, Column> = {
  todo: {
    id: 'todo',
    title: 'To Do',
    taskIds: ['task-1', 'task-2'],
  },
  inprogress: {
    id: 'inprogress',
    title: 'In Progress',
    taskIds: [],
  },
  done: {
    id: 'done',
    title: 'Done',
    taskIds: ['task-3'],
  },
};

const initialColumnOrder = ['todo', 'inprogress', 'done'];

function TaskCard({ task, onEdit }: { task: Task; onEdit: (t: Task) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: task.id, data: { type: 'task' } });
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
      className="mb-2 cursor-pointer rounded bg-white p-2 shadow"
      onClick={() => onEdit(task)}
    >
      <div className="font-medium">{task.title}</div>
      <div className="text-xs text-gray-500">
        {task.division} • {task.priority}
        {task.dueDate ? ` • Fällig ${task.dueDate}` : ''}
      </div>
      {task.emails && task.emails.length > 0 && (
        <div className="mt-1 text-xs text-blue-500">📧 {task.emails[0]}</div>
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
      className="flex w-1/3 flex-col rounded bg-gray-100 p-4"
    >
      <h2 className="mb-4 text-lg font-semibold">{column.title}</h2>
      <SortableContext items={column.taskIds}>
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} onEdit={onEditTask} />
        ))}
      </SortableContext>
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
  const [emails, setEmails] = useState(initial?.emails?.join(',') ?? '');

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
          emails: emails
            .split(',')
            .map((m) => m.trim())
            .filter(Boolean),
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
      <textarea
        value={emails}
        onChange={(e) => setEmails(e.target.value)}
        placeholder="E-Mails (comma separated)"
        className="w-full border p-1"
      />
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

function SettingsMenu({ onAddColumn }: { onAddColumn: (title: string) => void }) {
  return (
    <div className="absolute right-4 top-12 w-48 rounded border bg-white p-4 shadow">
      <button
        className="w-full text-left"
        onClick={() => {
          const title = prompt('Spaltenname');
          if (title) onAddColumn(title);
        }}
      >
        Spalte hinzufügen
      </button>
    </div>
  );
}

export function KanbanBoard() {
  const [tasks, setTasks] = useState<Record<string, Task>>(initialTasks);
  const [columns, setColumns] = useState<Record<string, Column>>(initialColumns);
  const [columnOrder, setColumnOrder] = useState<string[]>(initialColumnOrder);
  const [editing, setEditing] = useState<Task | null>(null);
  const [filterDivision, setFilterDivision] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [showSettings, setShowSettings] = useState(false);

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

  const addColumn = (title: string) => {
    const id = `col-${Date.now()}`;
    setColumns({ ...columns, [id]: { id, title, taskIds: [] } });
    setColumnOrder([...columnOrder, id]);
  };

  return (
    <DndContext collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
      <div className="mb-4 flex items-center gap-2">
        <button
          className="bg-green-500 px-2 text-white"
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
          Neue Aufgabe
        </button>
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
        <button
          className="ml-auto border px-2"
          onClick={() => setShowSettings((s) => !s)}
        >
          Einstellungen
        </button>
        {showSettings && <SettingsMenu onAddColumn={addColumn} />}
      </div>
      <SortableContext items={columnOrder}>
        <div className="flex w-full gap-4">
          {columnOrder.map((columnId) => {
            const column = columns[columnId];
            const taskList = column.taskIds
              .map((id) => tasks[id])
              .filter((t) => t && (!filterDivision || t.division === filterDivision))
              .filter((t) => t && (!filterPriority || t.priority === filterPriority));
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
