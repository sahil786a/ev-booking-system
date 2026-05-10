import { useQuery } from '@tanstack/react-query';

import { fetchStationDetail, fetchStations, fetchAvailability, normalizeStation } from '../api/stationApi';
import type { AvailabilityPayload } from '../api/stationApi';
import { stationQueryKeys } from '../constants/queryKeys';
import { defaultPollIntervalMs } from '../services/realtimeService';

export function useStations(enabled: boolean) {
  return useQuery({
    queryKey: stationQueryKeys.list,
    queryFn: async () => {
      const stations = await fetchStations();
      return stations.map(normalizeStation);
    },
    enabled,
    refetchInterval: defaultPollIntervalMs(),
    staleTime: 10_000,
  });
}

export function useStationDetail(stationId: number | undefined, enabled: boolean) {
  return useQuery({
    queryKey: stationId ? stationQueryKeys.detail(stationId) : [...stationQueryKeys.list, 'invalid'],
    queryFn: async () => {
      if (!stationId) return null;
      const station = await fetchStationDetail(stationId);
      return station ? normalizeStation(station) : null;
    },
    enabled: Boolean(stationId && enabled),
    refetchInterval: defaultPollIntervalMs(),
    staleTime: 10_000,
  });
}

export function useStationAvailability(params: {
  stationId?: number;
  bookingDate?: string;
  startTime?: string;
  endTime?: string;
  enabled: boolean;
}) {
  const scope = {
    booking_date: params.bookingDate,
    start_time: params.startTime,
    end_time: params.endTime,
  };
  const stationKey = params.stationId ?? 0;
  return useQuery<{ stationId?: number | null } & AvailabilityPayload>({
    queryKey: stationQueryKeys.availability(stationKey, scope),
    queryFn: async () => {
      if (!params.stationId) return { stationId: null };
      return {
        ...(await fetchAvailability(params.stationId, scope)),
        stationId: params.stationId,
      };
    },
    enabled: Boolean(params.stationId && params.enabled),
    refetchInterval: defaultPollIntervalMs(),
    staleTime: 5_000,
  });
}
