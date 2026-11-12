import { api } from './api';
import type { CurrentUser } from '../types/auth';

interface LoginResponse {
  access: string;
  refresh: string;
}

export async function login(username: string, password: string) {
  const response = await api.post<LoginResponse>('/auth/login/', {
    username,
    password,
  });

  localStorage.setItem('access_token', response.data.access);
  localStorage.setItem('refresh_token', response.data.refresh);

  return response.data;
}

export function logout() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
}

export async function getCurrentUser(): Promise<CurrentUser> {
  const response = await api.get<CurrentUser>('/auth/me/');
  return response.data;
}