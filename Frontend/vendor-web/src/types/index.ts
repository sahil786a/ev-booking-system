// ─── Auth ────────────────────────────────────────────────────────────────────

export interface Vendor {
  id: number;
  name: string;
  business_name: string;
  email: string;
  phone: string;
  role: 'VENDOR';
}

export interface AuthState {
  vendor: Vendor | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  business_name: string;
  email: string;
  password: string;
  phone: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  vendor: Vendor;
}

// ─── Stations ────────────────────────────────────────────────────────────────

export interface Station {
  id: number;
  vendor_id: number;
  name: string;
  latitude: number | string;
  longitude: number | string;
  contact: string;
  total_slots: number;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface StationPayload {
  name: string;
  latitude: number;
  longitude: number;
  contact: string;
  total_slots: number;
}

// ─── Bookings ────────────────────────────────────────────────────────────────

export type BookingStatus = 'booked' | 'completed' | 'cancelled';

export interface Booking {
  id: number;
  user_id: number;
  station_id: number;
  slot_start: string;
  slot_end: string;
  status: BookingStatus;
  created_at: string;
  updated_at?: string;
  station_name?: string;
  user_name?: string;
  user_email?: string;
}

export interface BookingStatusPayload {
  status: BookingStatus;
}

// ─── API ──────────────────────────────────────────────────────────────────────

export interface ApiError {
  message: string;
  status?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total?: number;
}
