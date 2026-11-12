import { useQuery } from '@tanstack/react-query';
import { getCurrentUser } from '../services/authService';

export function useCurrentUser() {
  const hasToken = Boolean(localStorage.getItem('access_token'));
  const query = useQuery({
    queryKey: ['currentUser'],
    queryFn: getCurrentUser,
    retry: false,
    staleTime: 60_000,
    enabled: hasToken,
  });

  const role = query.data?.role;

  return {
    ...query,
    hasToken,
    role,
    isAdmin: role === 'ADMIN',
    isSupport: role === 'SUPPORT',
    isDeveloper: role === 'DEVELOPER',
    canDevelop: role === 'ADMIN' || role === 'DEVELOPER',
    canValidate: role === 'ADMIN' || role === 'SUPPORT',
  };
}
