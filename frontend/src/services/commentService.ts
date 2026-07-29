import { api } from './api';
import type { TaskComment } from '../types/task';

export async function createTaskComment(taskId: number, comment: string) {
  const response = await api.post<TaskComment>('/comments/', {
    task: taskId,
    comment,
  });

  return response.data;
}