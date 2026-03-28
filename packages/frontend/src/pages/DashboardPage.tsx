/**
 * Página: Dashboard
 * Página principal después del login
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card } from '@components';
import { AuthService } from '@services';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    // Cargar datos del usuario del localStorage
    const userJSON = localStorage.getItem('user');
    if (userJSON) {
      try {
        setUser(JSON.parse(userJSON));
      } catch (err) {
        console.error('Error parsing user:', err);
      }
    }
  }, []);

  const handleLogout = async () => {
    try {
      setLoggingOut(true);

      // Limpiar datos
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');

      // Limpiar estado
      setUser(null);

      // Redirigir al login
      navigate('/login', { replace: true });
    } catch (err) {
      console.error('Logout error:', err);
      setLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-6xl mx-auto px-8 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">U-Ride</h1>
            {user && <p className="text-sm text-gray-600 mt-1">Bienvenido, {user.name}</p>}
          </div>
          <Button
            onClick={handleLogout}
            loading={loggingOut}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-md font-semibold"
          >
            {loggingOut ? 'Cerrando...' : 'Cerrar Sesión'}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-8 py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">¿Qué deseas hacer?</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card title="🔍 Buscar Viajes" description="Encuentra viajes disponibles">
            <button className="text-blue-600 hover:underline font-medium">Ver viajes →</button>
          </Card>

          <Card title="📍 Publicar Viaje" description="Comparte tu viaje">
            <button className="text-blue-600 hover:underline font-medium">Publicar →</button>
          </Card>

          <Card title="🚗 Mis Viajes" description="Administra tus viajes">
            <button className="text-blue-600 hover:underline font-medium">Ver mis viajes →</button>
          </Card>
        </div>

        {/* User Info Card */}
        {user && (
          <div className="mt-8 p-6 bg-white rounded-lg shadow">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Tu Información</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="text-base font-medium text-gray-900">{user.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Rol</p>
                <p className="text-base font-medium text-gray-900">
                  {user.role === 'STUDENT' ? 'Estudiante' : user.role}
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};


