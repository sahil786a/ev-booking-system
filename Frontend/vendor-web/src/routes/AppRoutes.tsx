import React, { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useAuth } from '@/hooks/useAuth';

const Login     = lazy(() => import('@/pages/Login'));
const Register  = lazy(() => import('@/pages/Register'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Stations  = lazy(() => import('@/pages/Stations'));
const Bookings  = lazy(() => import('@/pages/Bookings'));
const Profile   = lazy(() => import('@/pages/Profile'));
const NotFound  = lazy(() => import('@/pages/NotFound'));

const PageLoader = () => (
  <div className="flex items-center justify-center h-64">
    <LoadingSpinner size="md" label="Loading…" />
  </div>
);

// Redirect authenticated users away from /login and /register
const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <LoadingSpinner fullPage />;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

// Wraps a page in DashboardLayout
const WithLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <DashboardLayout>{children}</DashboardLayout>
);

export const AppRoutes: React.FC = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public */}
        <Route path="/login"    element={<AuthGuard><Login /></AuthGuard>} />
        <Route path="/register" element={<AuthGuard><Register /></AuthGuard>} />

        {/* Protected — each route rendered inside DashboardLayout */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<WithLayout><Dashboard /></WithLayout>} />
          <Route path="/stations"  element={<WithLayout><Stations /></WithLayout>} />
          <Route path="/bookings"  element={<WithLayout><Bookings /></WithLayout>} />
          <Route path="/profile"   element={<WithLayout><Profile /></WithLayout>} />
        </Route>

        {/* Fallbacks */}
        <Route path="/"  element={<Navigate to="/dashboard" replace />} />
        <Route path="*"  element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};
