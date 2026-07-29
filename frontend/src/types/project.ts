export interface Project {
  id: number;
  name: string;
  code: string;
  description?: string;
  is_active: boolean;
  tasks_count?: number;
  created_at: string;
}