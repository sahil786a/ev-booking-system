import type { QueryClient } from '@tanstack/react-query';
import { io, Socket } from 'socket.io-client';
import { useEffect } from 'react';

import { bookingQueryKeys, stationQueryKeys } from '../constants/queryKeys';
import { getApiBaseUrl } from '../utils/constants';

let socket: Socket | null = null;

export function initSocket() {
  if (!socket) {
    socket = io(getApiBaseUrl(), {
      transports: ['websocket'],
      autoConnect: true,
    });
    
    socket.on('connect', () => {
      console.log('[Socket] Connected');
    });

    socket.on('disconnect', () => {
      console.log('[Socket] Disconnected');
    });
  }
  return socket;
}

export function triggerSoftRefresh(client: QueryClient): void {
  void client.invalidateQueries({ queryKey: stationQueryKeys.list });
  void client.invalidateQueries({ queryKey: bookingQueryKeys.mine });
}

export function defaultPollIntervalMs(): number {
  return 30_000;
}

export function useStationRealtime(stationId: number | string | undefined, client: QueryClient) {
  useEffect(() => {
    if (!stationId) return;
    
    const s = initSocket();
    const sid = String(stationId);
    
    s.emit('subscribe_station', sid);
    console.log(`[Socket] Subscribed to station:${sid}`);
    
    const onSlotUpdate = (data: any) => {
      console.log(`[Socket] slot_update for station:${sid}`, data);
      // Invalidate the specific station's queries to refetch
      void client.invalidateQueries({ queryKey: stationQueryKeys.detail(Number(sid)) });
      void client.invalidateQueries({ queryKey: stationQueryKeys.availability(Number(sid)) });
      // Invalidate bookings if we have any active
      void client.invalidateQueries({ queryKey: bookingQueryKeys.mine });
    };

    const onQueueUpdate = (data: any) => {
      console.log(`[Socket] queue_update for station:${sid}`, data);
      // We can invalidate a custom query key for queue status here when needed
      void client.invalidateQueries({ queryKey: ['queue', Number(sid)] });
    };
    
    s.on('slot_update', onSlotUpdate);
    s.on('queue_update', onQueueUpdate);
    
    return () => {
      s.emit('unsubscribe_station', sid);
      s.off('slot_update', onSlotUpdate);
      s.off('queue_update', onQueueUpdate);
      console.log(`[Socket] Unsubscribed from station:${sid}`);
    };
  }, [stationId, client]);
}
