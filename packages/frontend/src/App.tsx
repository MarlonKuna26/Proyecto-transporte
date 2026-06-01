import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { Layout } from '@/components/Layout';
import {
  LoginPage, RegisterPage, DashboardPage, RidesPage,
  MyRidesPage, MyRequestsPage, ProfilePage, AdminPage,
  TrackingPage, PaymentsPage, ForgotPasswordPage, ResetPasswordPage,
  MyReportsPage,
} from '@/pages';

/** Ruta protegida: redirige a /login si no hay sesión */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="page-gradient min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="relative w-12 h-12 mx-auto mb-4 flex items-center justify-center">
          <div className="absolute inset-0 border-4 border-zinc-100/20 rounded-full" />
          <div className="absolute inset-0 border-4 border-white border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="text-white/80 font-semibold tracking-wide text-xs uppercase">Cargando...</p>
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

/** Ruta que requiere rol STUDENT */
function StudentRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (user?.role !== 'STUDENT') return <Navigate to="/admin" replace />;
  return <>{children}</>;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          {/* Rutas públicas */}
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
          <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
          <Route path="/reset-password" element={<PublicRoute><ResetPasswordPage /></PublicRoute>} />

          {/* Rutas protegidas con Layout */}
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<DashboardPage />} />
            
            {/* Rutas exclusivas para Estudiantes/Pasajeros/Conductores */}
            <Route path="/rides" element={<StudentRoute><RidesPage /></StudentRoute>} />
            <Route path="/my-rides" element={<StudentRoute><MyRidesPage /></StudentRoute>} />
            <Route path="/my-requests" element={<StudentRoute><MyRequestsPage /></StudentRoute>} />
            <Route path="/payments" element={<StudentRoute><PaymentsPage /></StudentRoute>} />
            <Route path="/tracking/:rideId" element={<StudentRoute><TrackingPage /></StudentRoute>} />
            <Route path="/profile" element={<StudentRoute><ProfilePage /></StudentRoute>} />
            <Route path="/my-reports" element={<StudentRoute><MyReportsPage /></StudentRoute>} />
            
            {/* Rutas exclusivas para Admin */}
            <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
          </Route>

          {/* Redirects */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={
            <div className="page-gradient min-h-screen flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-white/10 rounded-full flex items-center justify-center text-white">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polygon points="1 6 8 2 15 6 22 2 22 18 15 22 8 18 1 22" />
                    <line x1="8" y1="2" x2="8" y2="18" />
                    <line x1="15" y1="6" x2="15" y2="22" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">Página no encontrada</h1>
                <a href="/dashboard" className="text-white/70 hover:text-white font-medium underline">← Volver al inicio</a>
              </div>
            </div>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
