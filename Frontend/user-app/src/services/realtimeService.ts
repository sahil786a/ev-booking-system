/** Real-time scaffolding: prefer WebSockets when backend supports them; fall back to polling via TanStack Query. */

import type { QueryClient } from '@tanstack/react-query';

import { bookingQueryKeys, stationQueryKeys } from '../constants/queryKeys';

export function triggerSoftRefresh(client: QueryClient): void {
  void client.invalidateQueries({ queryKey: stationQueryKeys.list });
  void client.invalidateQueries({ queryKey: bookingQueryKeys.mine });
}

export function defaultPollIntervalMs(): number {
  return 30_000;
}
