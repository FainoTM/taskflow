
import { api } from './api';
import type { Project } from '../types/project';

export interface ProjectPayload {
  name: string;
  code: string;
  description: string;
  is_active: boolean;
}

export async function getProjects(): Promise<Project[]> {
  const response = await api.get<Project[]>('/projects/');
  return response.data;
}

export async function createProject(
  data: ProjectPayload
): Promise<Project> {
  const response = await api.post<Project>('/projects/', data);
  return response.data;
}

export async function updateProject(
  id: number,
  data: Partial<ProjectPayload>
): Promise<Project> {
  const response = await api.patch<Project>(
    `/projects/${id}/`,
    data
  );
  return response.data;
}

export async function toggleProjectStatus(
  project: Project
): Promise<Project> {
  return updateProject(project.id, {
    is_active: !project.is_active,
  });
}
