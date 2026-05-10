export const APP_NAME = 'EV Charge Hub';
export const APP_TAGLINE = 'Vendor Portal';

export const BOOKING_STATUSES = ['booked', 'completed', 'cancelled'] as const;

export const STATUS_LABELS: Record<string, string> = {
  booked: 'Active',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export const NAV_ITEMS = [
  { label: 'Dashboard', path: '/dashboard', icon: 'LayoutDashboard' },
  { label: 'Stations', path: '/stations', icon: 'MapPin' },
  { label: 'Bookings', path: '/bookings', icon: 'CalendarClock' },
  { label: 'Profile', path: '/profile', icon: 'UserCircle' },
] as const;

export const COMING_SOON_ITEMS = [
  { label: 'Payments', icon: 'CreditCard' },
  { label: 'Analytics Pro', icon: 'BarChart3' },
  { label: 'SMS Alerts', icon: 'MessageSquare' },
  { label: 'GPS Tracking', icon: 'Navigation' },
] as const;
