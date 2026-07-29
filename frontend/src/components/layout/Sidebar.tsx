import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  KanbanSquare,
  PlusCircle,
  FolderKanban,
} from 'lucide-react';

const menu = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Kanban',
    path: '/kanban',
    icon: KanbanSquare,
  },
  {
    label: 'Nova Task',
    path: '/tasks/nova',
    icon: PlusCircle,
  },
  {
    label: 'Projetos',
    path: '/projects',
    icon: FolderKanban,
  },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-0 z-50 h-screen w-64 bg-slate-950 text-white">
      <div className="border-b border-slate-800 px-6 py-5">
        <h1 className="text-xl font-bold">TaskFlow</h1>
        <p className="mt-1 text-sm text-slate-400">Controle de chamados</p>
      </div>

      <nav className="space-y-2 p-4">
        {menu.map((item) => {
          const Icon = item.icon;
          const active = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm transition ${
                active
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}