// Shared constants will be defined here

export const API_ROUTES = {
  AUTH: '/api/v1/auth',
  USERS: '/api/v1/users',
  RIDES: '/api/v1/rides',
  REQUESTS: '/api/v1/requests',
  ADMIN: '/api/v1/admin',
};

export const USER_ROLES = {
  STUDENT: 'student',
  ADMIN: 'admin',
} as const;

export const RIDE_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export const REQUEST_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
} as const;
