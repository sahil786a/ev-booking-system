import { QueryClient } from '@tanstack/react-query';

export const queryClientSingleton = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});
