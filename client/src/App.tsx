import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
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

const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <React.Suspense fallback={<div className="flex items-center justify-center h-screen text-white">Loading...</div>}>
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
    </AuthProvider>
  );
};

export default App;
