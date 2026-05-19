import type { EngineResult } from '../types';

interface Props {
  result: EngineResult | null;
}

export default function TracePanel({ result }: Props) {
  if (!result) {
    return (
      <div className="panel trace-panel">
        <h3>Results</h3>
        <p className="placeholder">No results yet. Click Simulate.</p>
      </div>
    );
  }

  return (
    <div className="panel trace-panel">
      <h3>Results</h3>

      {result.errors.length > 0 && (
        <div className="section errors">
          <h4>Errors</h4>
          {result.errors.map((e, i) => (
            <div key={i} className="error-item">[{e.type}] {e.message}</div>
          ))}
        </div>
      )}

      {result.final && (
        <div className="section final">
          <h4>Final Decision</h4>
          <div className="final-grid">
            <div><span>Route:</span> {result.final.route}</div>
            <div><span>Cluster:</span> {result.final.cluster}</div>
            <div><span>Endpoint:</span> {result.final.endpoint}</div>
          </div>
        </div>
      )}

      {result.rejected && (
        <div className="section rejected">
          <h4>Rejected</h4>
          <p>Status: {result.rejectStatus || 403}</p>
        </div>
      )}

      {result.warnings.length > 0 && (
        <div className="section warnings">
          <h4>Warnings</h4>
          {result.warnings.map((w, i) => (
            <div key={i} className="warning-item">
              {w.type}{w.routes ? `: ${w.routes.join(', ')}` : ''}
            </div>
          ))}
        </div>
      )}

      <div className="section trace">
        <h4>Execution Trace</h4>
        <div className="trace-steps">
          {result.trace.map((t, i) => (
            <div key={i} className={`trace-step trace-${t.result}`}>
              <span className="step-num">{i + 1}</span>
              <span className="step-name">{t.step}</span>
              <span className="step-result">{t.result}</span>
              <span className="step-reason">{t.reason}</span>
            </div>
          ))}
        </div>
      </div>

      {result.negativeTrace.length > 0 && (
        <div className="section negative">
          <h4>Negative Trace (Skipped Routes)</h4>
          {result.negativeTrace.map((n, i) => (
            <div key={i} className="negative-item">
              <span>{n.route}</span>
              <span className="reason">{n.reason}</span>
            </div>
          ))}
        </div>
      )}

      {result.mutations.length > 0 && (
        <div className="section mutations">
          <h4>Mutations</h4>
          {result.mutations.map((m, i) => (
            <div key={i} className="mutation-item">
              <span className="mutation-type">{m.type}</span>
              <span>{m.before} → {m.after}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
