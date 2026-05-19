import type { SimulateResponse, Request } from './types';

const API_BASE = 'http://localhost:8080/api';

export async function simulate(request: Request, config: string): Promise<SimulateResponse> {
  const res = await fetch(`${API_BASE}/simulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ request, config }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'simulation failed');
  }
  return res.json();
}

export async function validate(config: string): Promise<boolean> {
  const res = await fetch(`${API_BASE}/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: config,
  });
  return res.ok;
}
