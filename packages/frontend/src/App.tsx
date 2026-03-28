import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { LoginPage, DashboardPage } from '@pages';
import { AuthService } from '@services';

/**
 * App Component
 * Router principal de la aplicación
 *
 * Estructura:
 * - / → Login (público)
 * - /login → Login (público)
 * - /dashboard → Dashboard (requiere autenticación)
 */
function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!AuthService.getToken());

  // Detectar cambios en la autenticación
  useEffect(() => {
    // Función que se ejecuta cuando el storage cambia
    const handleStorageChange = () => {
      const hasToken = !!AuthService.getToken();
      setIsAuthenticated(hasToken);
    };

    // Escuchar cambios en localStorage
    window.addEventListener('storage', handleStorageChange);

    // También escuchar cuando se guarda el token (en la misma pestaña)
    const interval = setInterval(() => {
      const hasToken = !!AuthService.getToken();
      setIsAuthenticated(hasToken);
    }, 500); // Checar cada 500ms

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas públicas */}
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />}
        />
        <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />

        {/* Rutas protegidas */}
        <Route
          path="/dashboard"
          element={isAuthenticated ? <DashboardPage /> : <Navigate to="/login" replace />}
        />

        {/* 404 */}
        <Route path="*" element={<div>Página no encontrada</div>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

