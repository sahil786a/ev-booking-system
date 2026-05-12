import { api } from './client';

export type QueueStatus = {
  station_id: number;
  slot_start: string;
  slot_end: string;
  queue_length: number;
  your_position: number | null;
};

export type QueueEntry = {
  id: number;
  user_id: number;
  station_id: number;
  slot_start: string;
  slot_end: string;
  status: string;
  created_at: string;
  updated_at: string;
};

export async function joinQueue(payload: {
  station_id: number;
  booking_date: string;
  start_time: string;
  end_time: string;
}): Promise<{ queue_entry: QueueEntry; queue_length: number }> {
  const { station_id, ...rest } = payload;
  const res = await api.post(`/api/queue/${station_id}/join`, rest);
  return res.data;
}

export async function leaveQueue(payload: {
  station_id: number;
  booking_date: string;
  start_time: string;
  end_time: string;
}): Promise<{ message: string }> {
  const { station_id, ...rest } = payload;
  const res = await api.delete(`/api/queue/${station_id}/leave`, { data: rest });
  return res.data;
}

export async function getQueueStatus(
  station_id: number,
  query: { booking_date: string; start_time: string; end_time: string }
): Promise<QueueStatus> {
  const res = await api.get(`/api/queue/${station_id}/status`, { params: query });
  return res.data;
}
