
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

import {
  LayoutDashboard,
  KanbanSquare,
  PlusCircle,
  FolderKanban,
  PanelLeft,
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
  const [expanded, setExpanded] = useState(false);
  const location = useLocation();

  return (
    <aside
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      onFocusCapture={() => setExpanded(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setExpanded(false);
        }
      }}
      className={`
        fixed left-0 top-0 z-50 h-screen
        overflow-hidden bg-slate-950 text-white
        shadow-xl
        transition-[width] duration-300 ease-in-out
        ${expanded ? 'w-64' : 'w-[72px]'}
      `}
    >
      {/* Logo */}
      <div className="flex h-20 items-center border-b border-slate-800 px-5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center">
          <PanelLeft size={24} className="text-blue-400" />
        </div>

        <div
          className={`
            ml-3 overflow-hidden whitespace-nowrap
            transition-opacity duration-200
            ${expanded ? 'opacity-100' : 'opacity-0'}
          `}
        >
          <h1 className="text-xl font-bold">TaskFlow</h1>
          <p className="text-xs text-slate-400">
            Controle de chamados
          </p>
        </div>
      </div>

      {/* Navegação */}
      <nav className="space-y-2 px-3 py-5">
        {menu.map((item) => {
          const Icon = item.icon;

          const active =
            location.pathname === item.path ||
            (item.path === '/kanban' &&
              location.pathname.startsWith('/tasks/') &&
              location.pathname !== '/tasks/nova');

          return (
            <Link
              key={item.path}
              to={item.path}
              title={!expanded ? item.label : undefined}
              className={`
                flex h-12 items-center rounded-lg
                px-3 transition-colors
                ${
                  active
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800'
                }
              `}
            >
              <Icon size={22} className="shrink-0" />

              <span
                className={`
                  ml-4 whitespace-nowrap text-sm font-medium
                  transition-opacity duration-200
                  ${expanded ? 'opacity-100' : 'opacity-0'}
                `}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
