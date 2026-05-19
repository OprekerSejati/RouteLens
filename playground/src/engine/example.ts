import type { Request, Config } from './types';

export const EXAMPLE_REQUEST: Request = {
  method: 'GET',
  host: 'api.example.com',
  path: '/users/123',
};

export const EXAMPLE_CONFIG: Config = {
  routes: [
    { path: '/users', type: 'prefix', service: 'users-service' },
    { path: '/admin', type: 'prefix', service: 'admin-service' },
    { path: '/health', type: 'exact', service: 'health-service' },
  ],
};
