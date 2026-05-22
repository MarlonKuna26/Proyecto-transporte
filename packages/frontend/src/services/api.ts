/**
 * API Service — cliente HTTP centralizado (conectado a u_ride_esp)
 */

const API_URL = 'http://localhost:3002/api/v1';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${endpoint}`, { ...options, headers });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Error de conexión' }));
    throw new Error(body.error || body.message || `Error ${res.status}`);
  }

  return res.json();
}

// =================== AUTH ===================
export const api = {
  auth: {
    register: (data: { email: string; name: string; password: string }) =>
      request<any>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
    verifyEmail: (data: { email: string; code: string }) =>
      request<any>('/auth/verify-email', { method: 'POST', body: JSON.stringify(data) }),
    login: (data: { email: string; password: string }) =>
      request<any>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
    me: () => request<any>('/auth/me'),
    refresh: (refreshToken: string) =>
      request<any>('/auth/refresh', { method: 'POST', body: JSON.stringify({ refreshToken }) }),
    logout: () => request<any>('/auth/logout', { method: 'POST' }),
    forgotPassword: (email: string) =>
      request<any>('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
    resetPassword: (email: string, code: string, newPassword: string) =>
      request<any>('/auth/reset-password', { method: 'POST', body: JSON.stringify({ email, code, newPassword }) }),
  },

  // =================== USERS ===================
  users: {
    getProfile: (userId?: string) =>
      request<any>(userId ? `/users/profile/${userId}` : '/users/profile'),
    updateProfile: (data: any) =>
      request<any>('/users/profile', { method: 'PUT', body: JSON.stringify(data) }),
    getVehicles: () => request<any>('/users/vehicles'),
    createVehicle: (data: any) =>
      request<any>('/users/vehicles', { method: 'POST', body: JSON.stringify(data) }),
    deleteVehicle: (id: string) =>
      request<any>(`/users/vehicles/${id}`, { method: 'DELETE' }),
    updateVehicle: (id: string, data: any) =>
      request<any>(`/users/vehicles/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  },

  // =================== RIDES ===================
  rides: {
    list: (params?: Record<string, string>) => {
      const query = params ? '?' + new URLSearchParams(params).toString() : '';
      return request<any>(`/rides${query}`);
    },
    getById: (id: string) => request<any>(`/rides/${id}`),
    create: (data: any) =>
      request<any>('/rides', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      request<any>(`/rides/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    cancel: (id: string) =>
      request<any>(`/rides/${id}/cancel`, { method: 'PUT' }),
    myRides: (params?: Record<string, string>) => {
      const query = params ? '?' + new URLSearchParams(params).toString() : '';
      return request<any>(`/rides/my-rides${query}`);
    },
  },

  // =================== RIDE REQUESTS ===================
  rideRequests: {
    create: (data: any) =>
      request<any>('/ride-requests', { method: 'POST', body: JSON.stringify(data) }),
    myRequests: () => request<any>('/ride-requests/my-requests'),
    byRide: (rideId: string) => request<any>(`/ride-requests/ride/${rideId}`),
    passengers: (rideId: string) => request<any>(`/ride-requests/ride/${rideId}/passengers`),
    accept: (id: string) =>
      request<any>(`/ride-requests/${id}/accept`, { method: 'PUT' }),
    reject: (id: string, data?: { rejectReason: string }) =>
      request<any>(`/ride-requests/${id}/reject`, { method: 'PUT', body: data ? JSON.stringify(data) : undefined }),
    cancel: (id: string) =>
      request<any>(`/ride-requests/${id}/cancel`, { method: 'PUT' }),
  },

  // =================== RATINGS ===================
  ratings: {
    create: (data: any) =>
      request<any>('/ratings', { method: 'POST', body: JSON.stringify(data) }),
    byUser: (userId: string) => request<any>(`/ratings/user/${userId}`),
    getGiven: () => request<any>('/ratings/given'),
  },

  // =================== REPORTS ===================
  reports: {
    create: (data: any) =>
      request<any>('/reports', { method: 'POST', body: JSON.stringify(data) }),
    list: (status?: string) =>
      request<any>(`/reports${status ? `?status=${status}` : ''}`),
    resolve: (id: string, data: any) =>
      request<any>(`/reports/${id}/resolve`, { method: 'PUT', body: JSON.stringify(data) }),
  },

  // =================== ADMIN ===================
  admin: {
    stats: () => request<any>('/admin/stats'),
    users: () => request<any>('/admin/users'),
    suspendUser: (id: string, data: any) =>
      request<any>(`/admin/users/${id}/suspend`, { method: 'PUT', body: JSON.stringify(data) }),
    unsuspendUser: (id: string) =>
      request<any>(`/admin/users/${id}/unsuspend`, { method: 'PUT' }),
    warnUser: (id: string, message: string) =>
      request<any>(`/admin/users/${id}/warn`, { method: 'POST', body: JSON.stringify({ message }) }),
  },

  // =================== SECURITY RULES ===================
  securityRules: {
    list: () => request<any>('/security-rules'),
  },

  // =================== PAYMENTS ===================
  payments: {
    create: (data: { rideRequestId: string; amount: number; paymentMethod?: string; reference?: string }) =>
      request<any>('/payments', { method: 'POST', body: JSON.stringify(data) }),
    myPayments: () => request<any>('/payments/my-payments'),
    received: () => request<any>('/payments/received'),
    byRide: (rideId: string) => request<any>(`/payments/ride/${rideId}`),
    confirm: (id: string) =>
      request<any>(`/payments/${id}/confirm`, { method: 'PUT' }),
    refund: (id: string) =>
      request<any>(`/payments/${id}/refund`, { method: 'PUT' }),
    summary: () => request<any>('/payments/summary'),
  },

  // =================== TRACKING ===================
  tracking: {
    updateLocation: (rideId: string, data: { latitude: number; longitude: number; heading?: number; speed?: number }) =>
      request<any>(`/tracking/${rideId}/update`, { method: 'POST', body: JSON.stringify(data) }),
    getCurrent: (rideId: string) =>
      request<any>(`/tracking/${rideId}/current`),
    getHistory: (rideId: string) =>
      request<any>(`/tracking/${rideId}/history`),
    startRide: (rideId: string) =>
      request<any>(`/tracking/rides/${rideId}/start`, { method: 'PUT' }),
    completeRide: (rideId: string) =>
      request<any>(`/tracking/rides/${rideId}/complete`, { method: 'PUT' }),
    getEvents: (rideId: string) =>
      request<any>(`/tracking/${rideId}/events`),
  },
};
