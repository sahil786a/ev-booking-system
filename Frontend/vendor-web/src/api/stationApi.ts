import client from './client';
import type { Station, StationPayload } from '@/types';

// Convert coordinates to numbers (PostgreSQL NUMERIC returns as strings)
function normalizeStation(station: Station): Station {
  return {
    ...station,
    latitude: station.latitude != null ? Number(station.latitude) : station.latitude,
    longitude: station.longitude != null ? Number(station.longitude) : station.longitude,
  };
}

function normalizeStations(stations: Station[]): Station[] {
  return stations.map(normalizeStation);
}

export const stationApi = {
  create: async (payload: StationPayload): Promise<Station> => {
    const { data } = await client.post<{ station: Station }>('/api/stations', payload);
    return normalizeStation(data.station);
  },

  getMine: async (): Promise<Station[]> => {
    const { data } = await client.get<{ stations: Station[] }>('/api/stations/mine');
    return normalizeStations(data.stations ?? []);
  },

  getById: async (id: number): Promise<Station> => {
    const { data } = await client.get<{ station: Station }>(`/api/stations/${id}`);
    return normalizeStation(data.station);
  },

  update: async (id: number, payload: Partial<StationPayload>): Promise<Station> => {
    const { data } = await client.put<{ station: Station }>(`/api/stations/${id}`, payload);
    return normalizeStation(data.station);
  },

  delete: async (id: number): Promise<void> => {
    await client.delete(`/api/stations/${id}`);
  },
};
