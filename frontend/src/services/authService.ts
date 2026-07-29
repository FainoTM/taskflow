import { api } from './api';

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