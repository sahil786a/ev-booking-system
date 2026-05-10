import client from './client';
import type { Station, StationPayload } from '@/types';

export const stationApi = {
  create: async (payload: StationPayload): Promise<Station> => {
    const { data } = await client.post<{ station: Station }>('/api/stations', payload);
    return data.station;
  },

  getMine: async (): Promise<Station[]> => {
    const { data } = await client.get<{ stations: Station[] }>('/api/stations/mine');
    return data.stations ?? [];
  },

  getById: async (id: number): Promise<Station> => {
    const { data } = await client.get<{ station: Station }>(`/api/stations/${id}`);
    return data.station;
  },

  update: async (id: number, payload: Partial<StationPayload>): Promise<Station> => {
    const { data } = await client.put<{ station: Station }>(`/api/stations/${id}`, payload);
    return data.station;
  },

  delete: async (id: number): Promise<void> => {
    await client.delete(`/api/stations/${id}`);
  },
};
