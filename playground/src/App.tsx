import { useState, useEffect, useCallback } from 'react';
import RequestPanel from './components/RequestPanel';
import ConfigPanel from './components/ConfigPanel';
import FlowGraph from './components/FlowGraph';
import TracePanel from './components/TracePanel';
import { execute } from './engine';
import { EXAMPLE_REQUEST, EXAMPLE_CONFIG } from './engine/example';
import type { Request, Config, EngineResult } from './engine/types';
import './App.css';

export default function App() {
  const [request, setRequest] = useState<Request>(EXAMPLE_REQUEST);
  const [config, setConfig] = useState<Config>(EXAMPLE_CONFIG);
  const [result, setResult] = useState<EngineResult | null>(null);

  const runSimulation = useCallback(() => {
    const res = execute(request, config);
    setResult(res);
  }, [request, config]);

  useEffect(() => {
    runSimulation();
  }, []);

  const resetExample = () => {
    setRequest(EXAMPLE_REQUEST);
    setConfig(EXAMPLE_CONFIG);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>RouteLens</h1>
        <span className="subtitle">Interactive Traffic Decision Simulator</span>
      </header>

      <div className="layout">
        <div className="left">
          <RequestPanel request={request} onChange={setRequest} />
          <ConfigPanel config={config} onChange={setConfig} onReset={resetExample} />
          <button className="btn-simulate" onClick={runSimulation}>▶ Simulate</button>
        </div>
        <div className="center">
          <FlowGraph result={result} />
        </div>
        <div className="right">
          <TracePanel result={result} />
        </div>
      </div>

      <footer className="app-footer">
        100% client-side &middot; No backend required &middot; Deploy to GitHub Pages
      </footer>
    </div>
  );
}
