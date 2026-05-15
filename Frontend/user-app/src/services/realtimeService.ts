import type { QueryClient } from '@tanstack/react-query';
import { io, Socket } from 'socket.io-client';
import { useEffect } from 'react';

import { bookingQueryKeys, stationQueryKeys } from '../constants/queryKeys';
import { getApiBaseUrl } from '../utils/constants';

type SlotUpdatePayload = {
  station_id: number | string;
  available_slots: number;
  total_slots: number;
  ts: number;
};

type QueueUpdatePayload = {
  station_id: number | string;
  queue_length: number;
  ts: number;
};

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
    const numericId = Number(stationId);

    s.emit('subscribe_station', sid);
    console.log(`[Socket] Subscribed to station:${sid}`);

    // Guard: only act on events for THIS station's id to prevent cross-screen pollution
    const onSlotUpdate = (data: SlotUpdatePayload) => {
      if (String(data.station_id) !== sid) return;
      console.log(`[Socket] slot_update for station:${sid}`, data);
      void client.invalidateQueries({ queryKey: stationQueryKeys.detail(numericId) });
      void client.invalidateQueries({ queryKey: ['station', numericId, 'availability'] });
      void client.invalidateQueries({ queryKey: bookingQueryKeys.mine });
    };

    const onQueueUpdate = (data: QueueUpdatePayload) => {
      if (String(data.station_id) !== sid) return;
      console.log(`[Socket] queue_update for station:${sid}`, data);
      void client.invalidateQueries({ queryKey: ['queue', numericId] });
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
