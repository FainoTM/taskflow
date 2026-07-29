import { useQuery } from '@tanstack/react-query';
import { getTasks } from '../../services/taskService';

export function DashboardPage() {
  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: getTasks,
  });

  const open = tasks.filter((task) => task.status === 'OPEN').length;
  const development = tasks.filter((task) => task.status === 'DEVELOPMENT').length;
  const validation = tasks.filter((task) => task.status === 'VALIDATION').length;
  const finished = tasks.filter((task) => task.status === 'FINISHED').length;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Dashboard</h1>

      <div className="grid grid-cols-4 gap-4">
        <Card title="Abertas" value={open} />
        <Card title="Em desenvolvimento" value={development} />
        <Card title="Validação" value={validation} />
        <Card title="Finalizadas" value={finished} />
      </div>

      <div className="mt-6 rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">Tasks recentes</h2>

        <div className="space-y-3">
          {tasks.slice(0, 5).map((task) => (
            <div
              key={task.id}
              className="flex items-center justify-between rounded-lg border border-slate-200 p-4"
            >
              <div>
                <strong>#{task.id} - {task.title}</strong>
                <p className="text-sm text-slate-500">{task.project_name}</p>
              </div>

              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs">
                {task.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Card({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <p className="text-sm text-slate-500">{title}</p>
      <strong className="mt-2 block text-3xl text-slate-900">{value}</strong>
    </div>
  );
}