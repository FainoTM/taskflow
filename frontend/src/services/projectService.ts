import { api } from './api';
import type { Project } from '../types/project';

export async function getProjects() {
  const response = await api.get<Project[]>('/projects/');
  return response.data;
}