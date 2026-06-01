/**
 * Servicio: RideService
 * Comunicación con el backend para viajes (u_ride_esp)
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002/api/v1';

interface Ride {
  id: string;
  driverId: string;
  originZone: string;
  destinationZone: string;
  departureDate: string;
  departureTime: string;
  availableSeats: number;
  pricePerSeat: number;
  status: string;
}

export class RideService {
  static async getAllRides(page = 1, limit = 10): Promise<{ data: Ride[]; total: number }> {
    const response = await fetch(
      `${API_URL}/rides?page=${page}&limit=${limit}`,
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch rides');
    }

    return response.json();
  }

  static async getRideById(id: string): Promise<Ride> {
    const response = await fetch(`${API_URL}/rides/${id}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch ride');
    }

    return response.json();
  }

  static async createRide(rideData: Partial<Ride>): Promise<Ride> {
    const response = await fetch(`${API_URL}/rides`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(rideData),
    });

    if (!response.ok) {
      throw new Error('Failed to create ride');
    }

    return response.json();
  }

  static async cancelRide(id: string): Promise<void> {
    const response = await fetch(`${API_URL}/rides/${id}/cancel`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to cancel ride');
    }
  }
  
  static async updateRide(id: string, rideData: Partial<Ride>): Promise<Ride> {
    const response = await fetch(`${API_URL}/rides/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(rideData),
    });

    if (!response.ok) {
      throw new Error('Failed to update ride');
    }

    return response.json();
  }
}
