
import { Outlet } from 'react-router-dom';

import { Sidebar } from '../components/layout/Sidebar';
import { Header } from '../components/layout/Header';

export function DashboardLayout() {
  return (
    <div className="min-h-screen w-full bg-slate-100">
      {/* Sidebar fixa e sobreposta */}
      <Sidebar />

      {/* Conteúdo sempre começa após os 72px */}
      <div className="min-h-screen min-w-0 pl-[72px]">
        <Header />

        <main className="w-full min-w-0 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
