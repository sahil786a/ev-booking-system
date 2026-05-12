// ─── Auth ───────────────────────────────────────────────────────────────────

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'USER';
}

export interface AuthState {
  user: User | null;
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
  email: string;
  password: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
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
}

export interface StationAvailability {
  station_id: number;
  available_slots: number;
  total_slots: number;
  booked_slots: number;
  is_available: boolean;
  slot_start?: string;
  slot_end?: string;
}

// Station with optional distance (calculated on client)
export interface StationWithDistance extends Station {
  distanceKm?: number;
}

// ─── Bookings ────────────────────────────────────────────────────────────────

export type BookingStatus = 'booked' | 'completed' | 'cancelled';

export interface Booking {
  id: number;
  user_id: number;
  station_id: number;
  station_name?: string;
  slot_start: string;
  slot_end: string;
  status: BookingStatus;
  created_at: string;
  updated_at?: string;
}

export interface CreateBookingPayload {
  station_id: number;
  booking_date?: string;  // YYYY-MM-DD
  start_time?: string;    // HH:mm
  end_time?: string;      // HH:mm
}

// ─── Location ────────────────────────────────────────────────────────────────

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface LocationState {
  coords: Coordinates | null;
  permissionGranted: boolean | null;  // null = not asked yet
  isLoading: boolean;
  error: string | null;
}

// ─── Navigation ──────────────────────────────────────────────────────────────

export type RootStackParamList = {
  Splash:  undefined;
  Auth:    undefined;
  User:    undefined;
};

export type AuthStackParamList = {
  Login:    undefined;
  Register: undefined;
};

export type UserTabParamList = {
  HomeTab:     undefined;
  BookingsTab: undefined;
  ProfileTab:  undefined;
};

export type UserStackParamList = {
  MainTabs:        undefined;
  StationDetail:   { stationId: number };
  BookSlot:        { stationId: number; stationName: string };
  BookingSuccess:  { bookingId: number };
  BookingDetail:   { bookingId: number };
  NearbyStations:  undefined;
};

// ─── API ─────────────────────────────────────────────────────────────────────

export interface ApiError {
  message: string;
  status?: number;
}

// ─── Phase 2 Placeholders ────────────────────────────────────────────────────

/** Placeholder for future backend arrival-detection endpoint */
export interface ArrivalStatus {
  booking_id: number;
  is_near_station: boolean;
  distance_meters: number;
  // Requires backend Phase 2 endpoint: POST /api/bookings/:id/arrive
}

/** Placeholder for no-show tracking */
export interface NoShowStatus {
  booking_id: number;
  minutes_until_start: number;
  is_overdue: boolean;
  // Requires backend Phase 2 endpoint: PATCH /api/bookings/:id/no-show
}
