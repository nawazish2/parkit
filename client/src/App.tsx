import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/ui/toast';
import { ErrorBoundary } from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';

// Lazy-loaded pages (stubs for now — will fill in next)
const Landing = React.lazy(() => import('./pages/Landing'));
const Search = React.lazy(() => import('./pages/Search'));
const LotDetail = React.lazy(() => import('./pages/LotDetail'));
const MyBookings = React.lazy(() => import('./pages/MyBookings'));
const OwnerDashboard = React.lazy(() => import('./pages/OwnerDashboard'));
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));
const Profile = React.lazy(() => import('./pages/Profile'));

const AppLoading = () => (
  <div className="min-h-screen bg-[#0A0A0F] text-white flex items-center justify-center px-4">
    <div className="flex flex-col items-center gap-4 text-center">
      <div className="w-12 h-12 rounded-2xl bg-blue-600/15 border border-blue-500/25 flex items-center justify-center">
        <div className="w-5 h-5 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />
      </div>
      <div>
        <div className="text-lg font-semibold text-white">Loading ParkIt</div>
        <div className="text-sm text-slate-400">Preparing your parking workspace...</div>
      </div>
    </div>
  </div>
);

const App: React.FC = () => {
  const [isOffline, setIsOffline] = React.useState(!navigator.onLine);

  React.useEffect(() => {
    const goOnline = () => setIsOffline(false);
    const goOffline = () => setIsOffline(true);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  return (
    <AuthProvider>
      <ToastProvider>
        <ErrorBoundary>
          <BrowserRouter>
            {isOffline && (
              <div className="bg-amber-500/15 border-b border-amber-500/25 text-amber-300 text-center text-xs py-1.5 font-medium">
                You are offline. Some actions may be limited. Cached data is shown where available.
              </div>
            )}
            <React.Suspense fallback={<AppLoading />}>
            <Routes>
              {/* Public */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Driver */}
              <Route path="/search" element={<ProtectedRoute allowedRoles={['driver']}><Search /></ProtectedRoute>} />
              <Route path="/lot/:id" element={<ProtectedRoute allowedRoles={['driver', 'owner']}><LotDetail /></ProtectedRoute>} />
              <Route path="/bookings" element={<ProtectedRoute allowedRoles={['driver']}><MyBookings /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute allowedRoles={['driver']}><Profile /></ProtectedRoute>} />

              {/* Owner */}
              <Route path="/owner" element={<ProtectedRoute allowedRoles={['owner']}><OwnerDashboard /></ProtectedRoute>} />

              {/* Admin */}
              <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />

              {/* Default */}
              <Route path="/" element={<Landing />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </React.Suspense>
        </BrowserRouter>
        </ErrorBoundary>
      </ToastProvider>
    </AuthProvider>
  );
};

export default App;
