export type Method = 'GET' | 'POST' | 'PUT' | 'DELETE';
export type Protocol = 'HTTP' | 'HTTPS';
export type PathType = 'exact' | 'prefix' | 'regex';
export type HeaderType = 'exact' | 'regex' | 'presence';
export type BackendType = 'single' | 'weighted';
export type FilterType = 'auth' | 'rate_limit' | 'rewrite' | 'header_mod';
export type NodeState = 'active' | 'skipped' | 'failed';

export interface Request {
  method: Method;
  host: string;
  path: string;
  headers: Record<string, string>;
  port: number;
  protocol: Protocol;
}

export interface TraceStep {
  step: string;
  result: string;
  reason: string;
}

export interface NegativeTrace {
  route: string;
  reason: string;
}

export interface Mutation {
  type: string;
  before: string;
  after: string;
}

export interface Warning {
  type: string;
  routes?: string[];
  detail?: string;
}

export interface EngineError {
  type: string;
  message: string;
}

export interface FinalResult {
  route: string;
  cluster: string;
  endpoint: string;
}

export interface EngineResult {
  final?: FinalResult;
  trace: TraceStep[];
  mutations: Mutation[];
  rejected: boolean;
  rejectStatus?: number;
  warnings: Warning[];
  errors: EngineError[];
  negativeTrace: NegativeTrace[];
}

export interface SimulateResponse {
  result: EngineResult;
}
