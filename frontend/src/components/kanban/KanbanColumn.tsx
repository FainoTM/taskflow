import { useDroppable } from '@dnd-kit/core';
import { type Task } from '../../types/task';
import { TaskCard } from './TaskCard';

interface Props {
  id: string;
  title: string;
  tasks: Task[];
}

export function KanbanColumn({ id, title, tasks }: Props) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[650px] min-w-64 rounded-xl p-3 transition ${
        isOver ? 'bg-blue-100' : 'bg-slate-200'
      }`}
    >
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-semibold text-slate-800">{title}</h2>

        <span className="rounded-full bg-white px-2 py-1 text-xs">
          {tasks.length}
        </span>
      </div>

      <div className="space-y-3">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
}