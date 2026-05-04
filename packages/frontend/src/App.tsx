import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { Layout } from '@/components/Layout';
import {
  LoginPage, RegisterPage, DashboardPage, RidesPage,
  MyRidesPage, MyRequestsPage, ProfilePage, AdminPage,
  TrackingPage, PaymentsPage, ForgotPasswordPage, ResetPasswordPage,
} from '@/pages';

/** Ruta protegida: redirige a /login si no hay sesión */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="page-gradient min-h-screen flex items-center justify-center">
      <div className="text-center animate-pulse">
        <div className="text-5xl mb-4">🚗</div>
        <p className="text-navy-300 font-medium">Cargando...</p>
      </div>
    </div>
  );
  return user ? <>{children}</> : <Navigate to="/login" replace />;
}

/** Ruta pública: redirige a /dashboard si ya hay sesión */
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/dashboard" replace /> : <>{children}</>;
}

/** Ruta que requiere rol ADMIN */
function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (user?.role !== 'ADMIN') return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Rutas públicas */}
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
          <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
          <Route path="/reset-password" element={<PublicRoute><ResetPasswordPage /></PublicRoute>} />

          {/* Rutas protegidas con Layout */}
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/rides" element={<RidesPage />} />
            <Route path="/my-rides" element={<MyRidesPage />} />
            <Route path="/my-requests" element={<MyRequestsPage />} />
            <Route path="/payments" element={<PaymentsPage />} />
            <Route path="/tracking/:rideId" element={<TrackingPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
          </Route>

          {/* Redirects */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={
            <div className="page-gradient min-h-screen flex items-center justify-center">
              <div className="text-center">
                <p className="text-6xl mb-4">🗺️</p>
                <h1 className="text-2xl font-bold text-white mb-2">Página no encontrada</h1>
                <a href="/dashboard" className="text-primary-300 hover:text-primary-200 font-medium">← Volver al inicio</a>
              </div>
            </div>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
