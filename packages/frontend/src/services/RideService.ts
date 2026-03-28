/**
 * Servicio: RideService
 * Comunicación con el backend para viajes
 */

const API_URL = 'http://localhost:3000/api/v1';

interface Ride {
  id: string;
  driverId: string;
  departureLocation: string;
  destinationLocation: string;
  departureTime: string;
  availableSeats: number;
  fare: number;
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
}
