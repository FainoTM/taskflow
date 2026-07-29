import { api } from './api';
import type {
  KanbanData,
  Task,
  TaskDetail,
  TaskPriority,
  TaskStatus,
  TaskType,
} from '../types/task';

export interface CreateTaskPayload {
  title: string;
  description: string;
  task_type: TaskType;
  priority: TaskPriority;
  project: number;
  assigned_to?: number | null;
}

export async function getTasks() {
  const response = await api.get<Task[]>('/tasks/');
  return response.data;
}

export async function getKanbanTasks() {
  const response = await api.get<KanbanData>('/tasks/kanban/');
  return response.data;
}

export async function getTask(id: string) {
  const response = await api.get<TaskDetail>(`/tasks/${id}/`);
  return response.data;
}

export async function createTask(data: CreateTaskPayload) {
  const response = await api.post<Task>('/tasks/', data);
  return response.data;
}

export async function changeTaskStatus(id: number, status: TaskStatus) {
  const response = await api.patch<Task>(`/tasks/${id}/change_status/`, {
    status,
  });

  return response.data;
}

export async function uploadTaskAttachment(id: string, file: File) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post(
    `/tasks/${id}/upload_attachment/`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );

  return response.data;
}

export async function finishTask(
  id: string,
  data: {
    description: string;
    ops_code?: string;
    project_code?: string;
    old_code?: string;
    new_code?: string;
  }
) {
  const response = await api.post(`/tasks/${id}/finish/`, data);
  return response.data;
}