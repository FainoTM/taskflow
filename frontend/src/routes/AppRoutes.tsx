import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { LoginPage } from '../pages/auth/LoginPage';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { DashboardPage } from '../pages/dashboard/DashboardPage';
import { KanbanPage } from '../pages/kanban/KanbanPage';
import { TaskCreatePage } from '../pages/tasks/TaskCreatePage';
import { TaskDetailsPage } from '../pages/tasks/TaskDetailsPage';
// import { TaskFinishPage } from '../pages/tasks/TaskFinishPage';
// import { ProjectsPage } from '../pages/projects/ProjectsPage';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('access_token');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

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
          {/*<Route path="tasks/:id/finalizar" element={<TaskFinishPage />} />*/}
          {/*<Route path="projects" element={<ProjectsPage />} />*/}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}