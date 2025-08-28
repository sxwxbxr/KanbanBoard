import React, { useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  closestCorners,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Task {
  id: string;
  title: string;
}

interface Column {
  id: string;
  title: string;
  taskIds: string[];
}

const initialTasks: Record<string, Task> = {
  'task-1': { id: 'task-1', title: 'First task' },
  'task-2': { id: 'task-2', title: 'Second task' },
  'task-3': { id: 'task-3', title: 'Third task' },
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

function TaskCard({ task }: { task: Task }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: task.id });
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
      className="mb-2 rounded bg-white p-2 shadow"
    >
      {task.title}
    </div>
  );
}

function ColumnComponent({ column, tasks }: { column: Column; tasks: Task[] }) {
  return (
    <div className="flex w-1/3 flex-col rounded bg-gray-100 p-4">
      <h2 className="mb-4 text-lg font-semibold">{column.title}</h2>
      <SortableContext items={column.taskIds}>
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
      </SortableContext>
    </div>
  );
}

export function KanbanBoard() {
  const [columns, setColumns] = useState(initialColumns);
  const [tasks] = useState(initialTasks);

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

    const sourceColumn = findColumn(active.id as string);
    const destinationColumn = findColumn(over.id as string) || columns[over.id as string];
    if (!sourceColumn || !destinationColumn) return;

    if (sourceColumn.id === destinationColumn.id) {
      const oldIndex = sourceColumn.taskIds.indexOf(active.id as string);
      const newIndex = sourceColumn.taskIds.indexOf(over.id as string);
      sourceColumn.taskIds = arrayMove(sourceColumn.taskIds, oldIndex, newIndex);
      setColumns({ ...columns, [sourceColumn.id]: sourceColumn });
    } else {
      const fromIndex = sourceColumn.taskIds.indexOf(active.id as string);
      sourceColumn.taskIds.splice(fromIndex, 1);
      const overIndex = destinationColumn.taskIds.indexOf(over.id as string);
      const insertAt = overIndex === -1 ? destinationColumn.taskIds.length : overIndex;
      destinationColumn.taskIds.splice(insertAt, 0, active.id as string);
      setColumns({
        ...columns,
        [sourceColumn.id]: sourceColumn,
        [destinationColumn.id]: destinationColumn,
      });
    }
  };

  return (
    <DndContext collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
      <div className="flex w-full gap-4">
        {Object.values(columns).map((column) => (
          <ColumnComponent
            key={column.id}
            column={column}
            tasks={column.taskIds.map((id) => tasks[id])}
          />
        ))}
      </div>
    </DndContext>
  );
}
