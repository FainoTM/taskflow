export type UserRole = 'ADMIN' | 'SUPPORT' | 'DEVELOPER';

export interface CurrentUser {
  id: number;
  username: string;
  full_name: string;
  email: string;
  role: UserRole | null;
  is_staff: boolean;
}
