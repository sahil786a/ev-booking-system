import type { AxiosResponse } from 'axios';

import { api } from './client';

export type Station = {
  id: number | string;
  name?: string;
  title?: string;
  address?: string;
  description?: string;
  city?: string;
  latitude?: number | null;
  longitude?: number | null;
  lat?: number | null;
  lng?: number | null;
  hourly_rate?: number;
  plugs?: unknown;
  is_active?: boolean;
  status?: string;
  [key: string]: unknown;
};

export type AvailabilityPayload = Record<string, unknown>;

function coerceArray(payload: unknown): Station[] | null {
  if (Array.isArray(payload)) return payload as Station[];
  if (payload && typeof payload === 'object' && 'data' in payload) {
    const inner = (payload as { data: unknown }).data;
    return coerceArray(inner);
  }
  if (payload && typeof payload === 'object' && 'stations' in payload) {
    return coerceArray((payload as { stations: unknown }).stations);
  }
  return null;
}

function unwrapEntity<T>(payload: unknown): T {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return unwrapEntity<T>((payload as { data: unknown }).data);
  }
  return payload as T;
}

export async function fetchStations(): Promise<Station[]> {
  const res: AxiosResponse<unknown> = await api.get('/api/stations');
  const stations = coerceArray(res.data);
  return stations ?? [];
}

export async function fetchStationDetail(stationId: number): Promise<Station | null> {
  const res = await api.get(`/api/stations/${stationId}`);
  const entity = unwrapEntity<Station | { station?: Station }>(res.data);
  if (!entity || typeof entity !== 'object') return null;
  if ('station' in entity && (entity as { station?: Station }).station) {
    return (entity as { station: Station }).station;
  }
  return entity as Station;
}

export async function fetchAvailability(
  stationId: number,
  query?: { booking_date?: string; start_time?: string; end_time?: string },
): Promise<AvailabilityPayload> {
  const res = await api.get(`/api/stations/${stationId}/availability`, {
    params: query,
  });
  return unwrapEntity<AvailabilityPayload>(res.data) ?? {
    raw: res.data,
  };
}

export function normalizeStation(station: Station): Station {
  const lat = station.lat ?? station.latitude ?? null;
  const lng = station.lng ?? station.longitude ?? null;
  const name = station.name ?? station.title ?? 'Charging hub';
  return { ...station, lat, lng, name };
}
