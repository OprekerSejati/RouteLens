export type Method = 'GET' | 'POST' | 'PUT' | 'DELETE';
export type PathType = 'exact' | 'prefix';
export type NodeState = 'active' | 'skipped' | 'failed';

export interface RouteConfig {
  path: string;
  type: PathType;
  service: string;
}

export interface Request {
  method: Method;
  host: string;
  path: string;
}

export interface Config {
  routes: RouteConfig[];
}

export interface TraceStep {
  step: string;
  result: string;
  reason: string;
}

export interface Rejection {
  route: string;
  reason: string;
}

export interface EngineResult {
  selected?: { route: string; service: string };
  trace: TraceStep[];
  rejections: Rejection[];
  error?: string;
}
