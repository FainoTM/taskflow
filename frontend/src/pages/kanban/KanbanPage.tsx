import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';

import { getKanbanTasks, changeTaskStatus } from '../../services/taskService';
import { KanbanColumn } from '../../components/kanban/KanbanColumn';
import { TaskCard } from '../../components/kanban/TaskCard';
import type { Task, TaskStatus } from '../../types/task';
import { useCurrentUser } from '../../hooks/useCurrentUser';

const columns: { status: TaskStatus; title: string }[] = [
  { status: 'OPEN', title: 'Aberto' },
  { status: 'ANALYSIS', title: 'Em análise' },
  { status: 'DEVELOPMENT', title: 'Em desenvolvimento' },
  { status: 'VALIDATION', title: 'Aguardando validação' },
  { status: 'FINISHED', title: 'Finalizado' },
  { status: 'CANCELLED', title: 'Cancelado' },
];

const validTransitions: Partial<Record<TaskStatus, TaskStatus[]>> = {
  OPEN: ['ANALYSIS'],
  ANALYSIS: ['DEVELOPMENT'],
  DEVELOPMENT: ['ANALYSIS'],
};

export function KanbanPage() {
  const queryClient = useQueryClient();
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const { canDevelop } = useCurrentUser();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const { data, isLoading } = useQuery({
    queryKey: ['kanban'],
    queryFn: getKanbanTasks,
  });

  const allTasks = useMemo(() => {
    if (!data) {
      return [];
    }

    return Object.values(data).flat();
  }, [data]);

  const statusMutation = useMutation({
    mutationFn: ({ taskId, status }: { taskId: number; status: TaskStatus }) =>
      changeTaskStatus(taskId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  function handleDragStart(event: DragStartEvent) {
    if (!canDevelop) return;
    const taskId = Number(event.active.id.toString().replace('task-', ''));
    const task = allTasks.find((item) => item.id === taskId);

    if (task) {
      setActiveTask(task);
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    setActiveTask(null);

    if (!canDevelop || !over) {
      return;
    }

    const taskId = Number(active.id.toString().replace('task-', ''));
    const newStatus = over.id.toString().replace('column-', '') as TaskStatus;

    const task = allTasks.find((item) => item.id === taskId);

    if (!task) {
      return;
    }

    if (!validTransitions[task.status]?.includes(newStatus)) {
      return;
    }

    statusMutation.mutate({
      taskId,
      status: newStatus,
    });
  }

  if (isLoading) {
    return <p>Carregando Kanban...</p>;
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Kanban</h1>
          <p className="text-sm text-slate-500">
            {canDevelop
              ? 'Use a alça do card para avançar somente pelas etapas permitidas.'
              : 'Você pode acompanhar as tasks; a alteração de progresso é restrita a Programador e Administrador.'}
          </p>
        </div>

        <Link
          to="/tasks/nova"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Nova Task
        </Link>
      </div>

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-6 gap-4 overflow-x-auto pb-4">
          {columns.map((column) => (
            <KanbanColumn
              key={column.status}
              id={`column-${column.status}`}
              title={column.title}
              tasks={data?.[column.status] ?? []}
              canDrag={canDevelop && Boolean(validTransitions[column.status])}
              canDrop={canDevelop && ['ANALYSIS', 'DEVELOPMENT'].includes(column.status)}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask ? <TaskCard task={activeTask} isOverlay /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
