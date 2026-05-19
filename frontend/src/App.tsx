import { useState, useCallback, useRef } from 'react';
import RequestInput from './components/RequestInput';
import ConfigPanel from './components/ConfigPanel';
import FlowGraph from './components/FlowGraph';
import TracePanel from './components/TracePanel';
import { simulate } from './api';
import type { Request, EngineResult } from './types';
import './App.css';

const DEFAULT_REQUEST: Request = {
  method: 'GET',
  host: 'api.example.com',
  path: '/users/123',
  headers: { authorization: 'Bearer test-token' },
  port: 80,
  protocol: 'HTTP',
};

const NODE_LINES: Record<string, number> = {
  request: 0,
  normalize: 0,
  listener: 3,
  vhost: 10,
  route: 16,
  filters: 36,
  cluster: 49,
};

export default function App() {
  const [request, setRequest] = useState<Request>(DEFAULT_REQUEST);
  const [config, setConfig] = useState<string>('');
  const [result, setResult] = useState<EngineResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [highlightLine, setHighlightLine] = useState<number | null>(null);
  const [configErrors, setConfigErrors] = useState<Array<{ line: number; message: string }>>([]);
  const [stepMode, setStepMode] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const validateTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleNodeClick = useCallback((nodeId: string) => {
    const line = NODE_LINES[nodeId];
    if (line != null) {
      setHighlightLine(line);
    }
  }, []);

  const validateConfig = useCallback(async (yaml: string) => {
    if (!yaml.trim()) {
      setConfigErrors([]);
      return;
    }
    try {
      const res = await fetch('http://localhost:8080/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: yaml,
      });
      const data = await res.json();
      if (data.error) {
        const lineMatch = data.error.match(/line (\d+)/);
        setConfigErrors(lineMatch
          ? [{ line: parseInt(lineMatch[1]), message: data.error }]
          : [{ line: 1, message: data.error }]
        );
      } else if (data.conflicts?.length > 0) {
        setConfigErrors(data.conflicts.map((c: any) => ({
          line: 1,
          message: `${c.type}: ${c.message}`,
        })));
      } else {
        setConfigErrors([]);
      }
    } catch {
      setConfigErrors([]);
    }
  }, []);

  const handleConfigChange = useCallback((val: string) => {
    setConfig(val);
    if (validateTimer.current) clearTimeout(validateTimer.current);
    validateTimer.current = setTimeout(() => validateConfig(val), 800);
  }, [validateConfig]);

  const handleSimulate = useCallback(async () => {
    setLoading(true);
    setStepMode(false);
    try {
      const yaml = config || `listeners:
  - name: listener-1
    port: 80
    protocol: HTTP
    hostnames:
      - api.example.com
virtualHosts:
  - name: vh-1
    domains:
      - api.example.com
    routes:
      - users-route
routes:
  - id: users-route
    priority: 0
    createdAt: 1000
    match:
      path:
        type: prefix
        value: /users
      method:
        - GET
      headers: []
    filters: []
    backend:
      type: single
      clusters:
        - name: users-service
filters: []
clusters:
  - name: users-service
    endpoints:
      - users-pod-1
`;
      const res = await simulate(request, yaml);
      setResult(res.result);
    } catch (err) {
      setResult({
        trace: [{ step: 'error', result: 'failed', reason: String(err) }],
        mutations: [],
        rejected: false,
        warnings: [],
        errors: [{ type: 'API_ERROR', message: String(err) }],
        negativeTrace: [],
      });
    } finally {
      setLoading(false);
    }
  }, [request, config]);

  const handleStepThrough = useCallback(() => {
    if (!result) return;
    if (!stepMode) {
      setStepMode(true);
      setStepIndex(0);
    } else {
      const maxStep = result.trace.length;
      if (stepIndex < maxStep) {
        setStepIndex(i => i + 1);
      } else {
        setStepMode(false);
        setStepIndex(0);
      }
    }
  }, [result, stepMode, stepIndex]);

  const maxSteps = result ? result.trace.length : 0;

  return (
    <div className="app">
      <header className="app-header">
        <h1>RouteLens</h1>
        <span className="subtitle">Traffic Decision Debugging System</span>
        <div className="header-actions">
          {result && (
            <button className="btn-step" onClick={handleStepThrough}>
              {stepMode ? (stepIndex >= maxSteps ? 'Reset' : `Step ${stepIndex}/${maxSteps}`) : 'Step Through'}
            </button>
          )}
        </div>
      </header>

      <div className="app-layout">
        <div className="left-column">
          <RequestInput request={request} onChange={setRequest} />
          <ConfigPanel
            value={config}
            onChange={handleConfigChange}
            highlightLine={highlightLine}
            errors={configErrors}
          />
          <button
            className="btn-simulate"
            onClick={handleSimulate}
            disabled={loading}
          >
            {loading ? 'Simulating...' : '▶ Simulate'}
          </button>
        </div>

        <div className="center-column">
          <FlowGraph
            result={result}
            onNodeClick={handleNodeClick}
            stepMode={stepMode}
            stepIndex={stepIndex}
          />
        </div>

        <div className="right-column">
          <TracePanel result={result} />
        </div>
      </div>
    </div>
  );
}
