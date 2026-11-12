import axios from 'axios';

import { api } from './api';
import type {
  AssignmentType,
  KanbanData,
  Task,
  TaskAttachment,
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
  assignment_type: AssignmentType;
  assigned_to: number | null;
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

export async function uploadTaskAttachment(id: string | number, file: File) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post<TaskAttachment>(
    `/tasks/${id}/upload_attachment/`,
    formData
  );

  return response.data;
}

export interface AttachmentUploadFailure {
  file: File;
  message: string;
}

export interface AttachmentUploadResult {
  uploaded: TaskAttachment[];
  failed: AttachmentUploadFailure[];
}

function firstErrorMessage(value: string[] | string | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function getApiErrorMessage(error: unknown) {
  if (!axios.isAxiosError(error)) {
    return 'Ocorreu um erro inesperado.';
  }

  const data = error.response?.data as
    | Record<string, string[] | string | undefined>
    | undefined;
  const fileError = firstErrorMessage(data?.file);

  const firstFieldError = data
    ? Object.values(data).find((value) => Array.isArray(value) || typeof value === 'string')
    : undefined;
  const normalizedFieldError = firstErrorMessage(firstFieldError);

  return fileError
    ?? firstErrorMessage(data?.detail)
    ?? normalizedFieldError
    ?? 'Não foi possível concluir a operação.';
}

export async function uploadTaskAttachments(
  id: string | number,
  files: File[],
): Promise<AttachmentUploadResult> {
  const results = await Promise.allSettled(
    files.map((file) => uploadTaskAttachment(id, file)),
  );

  return results.reduce<AttachmentUploadResult>(
    (summary, result, index) => {
      if (result.status === 'fulfilled') {
        summary.uploaded.push(result.value);
      } else {
        summary.failed.push({
          file: files[index],
          message: getApiErrorMessage(result.reason),
        });
      }

      return summary;
    },
    {uploaded: [], failed: []},
  );
}

export interface ValidationPayload {
  description: string;
  ops_code?: string;
  project_code?: string;
  old_code?: File;
  new_code?: File;
}

export async function submitTaskForValidation(
  id: string,
  data: ValidationPayload
) {
  const formData = new FormData();
  formData.append('description', data.description);

  if (data.ops_code) formData.append('ops_code', data.ops_code);
  if (data.project_code) formData.append('project_code', data.project_code);
  if (data.old_code) formData.append('old_code', data.old_code);
  if (data.new_code) formData.append('new_code', data.new_code);

  const response = await api.post(
    `/tasks/${id}/submit_validation/`,
    formData
  );

  return response.data;
}

export async function approveTask(id: string, message = '') {
  const response = await api.post(`/tasks/${id}/approve/`, {
    message,
  });

  return response.data;
}

export async function rejectTask(id: string, message: string) {
  const response = await api.post(`/tasks/${id}/reject/`, {
    message,
  });

  return response.data;
}
