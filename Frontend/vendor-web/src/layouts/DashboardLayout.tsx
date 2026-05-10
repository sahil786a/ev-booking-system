import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  CalendarClock,
  ChevronDown,
  CreditCard,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  MessageSquare,
  Navigation,
  UserCircle,
  X,
  Zap,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { APP_NAME } from '@/utils/constants';
import { toast } from 'sonner';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { to: '/dashboard', icon: <LayoutDashboard size={17} />, label: 'Dashboard' },
  { to: '/stations',  icon: <MapPin size={17} />,          label: 'Stations' },
  { to: '/bookings',  icon: <CalendarClock size={17} />,   label: 'Bookings' },
  { to: '/profile',   icon: <UserCircle size={17} />,      label: 'Profile' },
];

const COMING_SOON = [
  { icon: <CreditCard size={15} />,   label: 'Payments' },
  { icon: <BarChart3 size={15} />,    label: 'Analytics Pro' },
  { icon: <MessageSquare size={15} />,label: 'SMS Alerts' },
  { icon: <Navigation size={15} />,   label: 'GPS Tracking' },
];

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { vendor, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login', { replace: true });
  };

  const sidebar = (
    <aside className="flex flex-col h-full bg-sidebar text-white overflow-hidden">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-sidebar-border shrink-0">
        <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/30">
          <Zap size={16} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white leading-none truncate">{APP_NAME}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Vendor Portal</p>
        </div>
        <button
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden text-slate-500 hover:text-white p-1"
        >
          <X size={18} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        <p className="text-[10px] font-semibold uppercase text-slate-600 tracking-widest px-3 mb-2">
          Main
        </p>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'active' : ''}`
            }
          >
            <span className="shrink-0">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}

        <p className="text-[10px] font-semibold uppercase text-slate-600 tracking-widest px-3 mt-6 mb-2">
          Coming Soon
        </p>
        {COMING_SOON.map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 cursor-not-allowed select-none"
          >
            <span className="shrink-0">{item.icon}</span>
            <span className="text-sm">{item.label}</span>
            <span className="ml-auto text-[9px] font-semibold uppercase bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded-full">
              Soon
            </span>
          </div>
        ))}
      </nav>

      {/* Vendor info + logout */}
      <div className="px-3 py-4 border-t border-sidebar-border shrink-0">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 cursor-pointer transition-colors group">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <span className="text-emerald-400 text-xs font-bold">
              {vendor?.name?.charAt(0).toUpperCase() ?? 'V'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">{vendor?.name}</p>
            <p className="text-[10px] text-slate-500 truncate">{vendor?.business_name}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="sidebar-link w-full mt-1 text-slate-500 hover:text-red-400 hover:bg-red-500/10"
        >
          <LogOut size={15} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-surface-secondary">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex w-[var(--sidebar-width)] shrink-0 flex-col">
        {sidebar}
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative z-10 w-72 flex flex-col animate-slide-in">
            {sidebar}
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-slate-100 flex items-center px-5 gap-4 shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          >
            <Menu size={20} />
          </button>

          <div className="flex-1" />

          {/* Vendor chip */}
          <Link to="/profile" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-sm">
              <span className="text-white text-xs font-bold">
                {vendor?.name?.charAt(0).toUpperCase() ?? 'V'}
              </span>
            </div>
            <div className="hidden sm:block text-right">
              <p className="text-xs font-semibold text-slate-800 leading-none">{vendor?.name}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{vendor?.business_name}</p>
            </div>
            <ChevronDown size={14} className="text-slate-400 hidden sm:block" />
          </Link>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-5 lg:p-7">
          <div className="max-w-7xl mx-auto animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
