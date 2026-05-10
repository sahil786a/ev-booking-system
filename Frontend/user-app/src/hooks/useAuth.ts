import { useAuthContext } from '../context/AuthContext';

export function useAuth(): ReturnType<typeof useAuthContext> {
  return useAuthContext();
}
