export type TaskStatus =
  | 'OPEN'
  | 'ANALYSIS'
  | 'DEVELOPMENT'
  | 'VALIDATION'
  | 'FINISHED'
  | 'CANCELED';

export type TaskPriority =
  | 'LOW'
  | 'MEDIUM'
  | 'HIGH'
  | 'URGENT';

export type TaskType =
  | 'BUG'
  | 'FEATURE'
  | 'SUPPORT'
  | 'DATABASE'
  | 'OTHER';

export type AssignmentType =
  | 'ALL'
  | 'USER';

export interface TaskComment {
  id: number;
  task: number;
  user: number;
  user_name: string;
  comment: string;
  created_at: string;
}

export interface TaskAttachment {
  id: number;
  task: number;
  file: string;
  file_url: string;
  original_name: string;
  uploaded_by: number;
  uploaded_by_name: string;
  created_at: string;
}

export interface TaskVersion {
  id: number;
  task: number;
  description: string;
  ops_code?: string;
  project_code?: string;
  old_code?: string;
  new_code?: string;
  created_by: number;
  created_by_name: string;
  created_at: string;
}

export interface Task {
  id: number;
  title: string;
  description: string;
  task_type: TaskType;
  status: TaskStatus;
  priority: TaskPriority;
  project: number;
  project_name: string;
  project_code: string;
  created_by: number;
  created_by_name: string;
  assigned_to: number | null;
  assigned_to_name: string | null;
  assignment_type: AssignmentType;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskDetail extends Task {
  comments: TaskComment[];
  attachments: TaskAttachment[];
  versions: TaskVersion[];
}

export type KanbanData = Record<TaskStatus, Task[]>;