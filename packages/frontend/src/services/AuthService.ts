/**
 * Servicio: AuthService
 * Comunicación con el backend para autenticación
 */

// API URL - usar variable de entorno o default
const API_URL = 'http://localhost:3002/api/v1';

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
      throw new Error(error.error || 'Login failed');
    }

    return response.json();
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
