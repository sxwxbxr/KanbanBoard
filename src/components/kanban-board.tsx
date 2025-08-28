/**
 * Basic Kanban board prototype for Next.js
 * uses React, @dnd-kit, Tailwind. Persisted in localStorage.
 */
"use client";
import React, { useEffect, useState } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Task {
  id: string;
  title: string;
}

interface Column {
  id: string;
  title: string;
  tasks: Task[];
}

const DEFAULT_COLUMNS: Column[] = [
  {
    id: "backlog",
    title: "Backlog",
    tasks: [
      { id: "t1", title: "Aufgabe 1" },
      { id: "t2", title: "Aufgabe 2" },
    ],
  },
  {
    id: "todo",
    title: "To Do",
    tasks: [{ id: "t3", title: "Aufgabe 3" }],
  },
  { id: "done", title: "Done", tasks: [] },
];

function uid() {
  return Math.random().toString(36).slice(2);
}

function usePersistentState<T>(key: string, init: T): [T, (v: T) => void] {
  const [state, setState] = useState<T>(() => {
    if (typeof window !== "undefined") {
      const raw = localStorage.getItem(key);
      if (raw) {
        try {
          return JSON.parse(raw) as T;
        } catch {}
      }
    }
    return init;
  });
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(key, JSON.stringify(state));
    }
  }, [key, state]);
  return [state, setState];
}

export default function KanbanBoard() {
  const [columns, setColumns] = usePersistentState<Column[]>(
    "kanban_columns",
    DEFAULT_COLUMNS
  );

  const sensors = useSensors(useSensor(PointerSensor));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    if (active.id === over.id) return;

    const sourceColIndex = columns.findIndex((col) =>
      col.tasks.some((t) => t.id === active.id.toString())
    );
    const destColIndex = columns.findIndex((col) =>
      col.tasks.some((t) => t.id === over.id.toString())
    );

    // dropping into empty column
    const overColumnIndex = columns.findIndex((c) => c.id === over.id);
    if (overColumnIndex !== -1 && sourceColIndex !== -1) {
      const sourceTasks = [...columns[sourceColIndex].tasks];
      const taskIndex = sourceTasks.findIndex((t) => t.id === active.id);
      const task = sourceTasks[taskIndex];
      sourceTasks.splice(taskIndex, 1);

      const destTasks = [...columns[overColumnIndex].tasks];
      destTasks.push(task);

      const newCols = [...columns];
      newCols[sourceColIndex].tasks = sourceTasks;
      newCols[overColumnIndex].tasks = destTasks;
      setColumns(newCols);
      return;
    }

    if (sourceColIndex !== -1 && destColIndex !== -1) {
      const sourceTasks = [...columns[sourceColIndex].tasks];
      const destTasks = [...columns[destColIndex].tasks];
      const sourceIndex = sourceTasks.findIndex((t) => t.id === active.id);
      const destIndex = destTasks.findIndex((t) => t.id === over.id);
      const [task] = sourceTasks.splice(sourceIndex, 1);
      destTasks.splice(destIndex, 0, task);
      const newCols = [...columns];
      newCols[sourceColIndex].tasks = sourceTasks;
      newCols[destColIndex].tasks = destTasks;
      setColumns(newCols);
    }
  }

  function addTask(columnId: string) {
    const title = prompt("Titel der Aufgabe?");
    if (!title) return;
    setColumns(
      columns.map((c) =>
        c.id === columnId
          ? { ...c, tasks: [...c.tasks, { id: uid(), title }] }
          : c
      )
    );
  }

  function addColumn() {
    const title = prompt("Spaltenname?");
    if (!title) return;
    setColumns([...columns, { id: uid(), title, tasks: [] }]);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-4 overflow-x-auto p-2">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          {columns.map((col) => (
            <div key={col.id} className="w-64 flex-shrink-0">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="font-bold">{col.title}</h2>
                <button
                  className="text-sm text-blue-500"
                  onClick={() => addTask(col.id)}
                >
                  +
                </button>
              </div>
              <SortableContext
                items={col.tasks.map((t) => t.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="flex flex-col gap-2 bg-gray-100 p-2 rounded">
                  {col.tasks.map((task) => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </div>
              </SortableContext>
            </div>
          ))}
        </DndContext>
      </div>
      <button
        onClick={addColumn}
        className="self-start ml-2 text-sm text-blue-500"
      >
        Neue Spalte
      </button>
    </div>
  );
}

function TaskCard({ task }: { task: Task }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="rounded border bg-white p-2 text-sm shadow"
    >
      {task.title}
    </div>
  );
}
