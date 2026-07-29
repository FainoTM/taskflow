import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { Header } from '../components/layout/Header';

export function DashboardLayout() {
  return (
    <div className="min-h-screen w-full bg-slate-100">
      <Sidebar />

      <div className="min-h-screen pl-64">
        <Header />

        <main className="w-full p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}