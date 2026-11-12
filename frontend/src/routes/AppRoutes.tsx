import type { ReactNode } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { LoginPage } from '../pages/auth/LoginPage';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { DashboardPage } from '../pages/dashboard/DashboardPage';
import { KanbanPage } from '../pages/kanban/KanbanPage';
import { TaskCreatePage } from '../pages/tasks/TaskCreatePage';
import { TaskDetailsPage } from '../pages/tasks/TaskDetailsPage';
import { TaskFinishPage } from '../pages/tasks/TaskFinishPage';
import { ProjectsPage } from '../pages/projects/ProjectsPage';
import { useCurrentUser } from '../hooks/useCurrentUser';
import type { UserRole } from '../types/auth';

function PrivateRoute({ children }: { children: ReactNode }) {
  const { hasToken, role, isLoading, isError } = useCurrentUser();

  if (!hasToken) {
    return <Navigate to="/login" replace />;
  }

  if (isLoading) return <p className="p-6">Validando acesso...</p>;
  if (isError || !role) return <Navigate to="/login" replace />;

  return children;
}

function RoleRoute({
  children,
  allowed,
}: {
  children: ReactNode;
  allowed: UserRole[];
}) {
  const { role, isLoading } = useCurrentUser();

  if (isLoading) return <p className="p-6">Validando acesso...</p>;
  if (!role || !allowed.includes(role)) return <Navigate to="/dashboard" replace />;

  return children;
}

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/"
          element={
            <PrivateRoute>
              <DashboardLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="kanban" element={<KanbanPage />} />
          <Route path="tasks/nova" element={<TaskCreatePage />} />
          <Route path="tasks/:id" element={<TaskDetailsPage />} />
          <Route
            path="tasks/:id/finalizar"
            element={
              <RoleRoute allowed={['ADMIN', 'DEVELOPER']}>
                <TaskFinishPage />
              </RoleRoute>
            }
          />
          <Route
            path="projects"
            element={
              <RoleRoute allowed={['ADMIN']}>
                <ProjectsPage />
              </RoleRoute>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
