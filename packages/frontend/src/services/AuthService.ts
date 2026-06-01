/**
 * Servicio: AuthService
 * Comunicación con el backend para autenticación
 */

// API URL - usar variable de entorno o default
// @ts-ignore
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002/api/v1';

interface LoginRequest {
  email: string;
  password: string;
}

interface AuthResponse {
  token: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

interface LoginApiResponse {
  success: boolean;
  data: {
    accessToken: string;
    refreshToken: string;
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
    };
  };
  message: string;
}

export class AuthService {
  static async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || error.message || 'Login failed');
    }

    const body: LoginApiResponse = await response.json();

    return {
      token: body.data.accessToken,
      refreshToken: body.data.refreshToken,
      user: body.data.user,
    };
  }

  static async logout(): Promise<void> {
    // TODO: Implementar logout en backend
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
  }

  static getToken(): string | null {
    return localStorage.getItem('token');
  }

  static setToken(token: string): void {
    localStorage.setItem('token', token);
  }
}
