/**
 * Página: Login
 * Autenticación de usuarios
 */

import React, { useState, FormEvent, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Card } from '@components';
import { AuthService } from '@services';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Llamar al servicio de autenticación
      const response = await AuthService.login({ email, password });

      // Guardar tokens
      AuthService.setToken(response.token);
      localStorage.setItem('refreshToken', response.refreshToken);
      localStorage.setItem('user', JSON.stringify(response.user));

      // Mostrar éxito
      setSuccess('¡Bienvenido! Redirigiendo...');

      // Redirigir al dashboard después de 1.5 segundos
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : 'Error al iniciar sesión';
      setError(errorMessage);
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailChange = (e: ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md" title="U-Ride" description="Inicia sesión en tu cuenta">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm">
              ❌ {error}
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-100 text-green-700 rounded-md text-sm">
              ✅ {success}
            </div>
          )}

          <Input
            id="email"
            type="email"
            label="Email Institucional"
            placeholder="tu.email@institucion.edu"
            value={email}
            onChange={handleEmailChange}
            required
            disabled={loading}
          />

          <Input
            id="password"
            type="password"
            label="Contraseña"
            placeholder="••••••••"
            value={password}
            onChange={handlePasswordChange}
            required
            disabled={loading}
          />

          <Button type="submit" loading={loading} className="w-full">
            {loading ? 'Iniciando sesión...' : 'Inicia Sesión'}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          ¿No tienes cuenta? {''}
          <a href="/register" className="text-blue-600 hover:underline">
            Regístrate aquí
          </a>
        </div>

        {/* Credenciales de prueba */}
        <div className="mt-6 p-3 bg-blue-50 rounded-md text-xs text-gray-600">
          <strong>Credenciales de prueba:</strong>
          <br />
          Email: test@institucion.edu
          <br />
          Contraseña: password123
        </div>
      </Card>
    </div>
  );
};

