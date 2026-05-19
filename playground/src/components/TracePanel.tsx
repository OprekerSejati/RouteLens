import type { EngineResult } from '../engine/types';

interface Props {
  result: EngineResult | null;
}

export default function TracePanel({ result }: Props) {
  if (!result) {
    return (
      <div className="panel">
        <h3>Execution Trace</h3>
        <p className="muted">Simulate to see results</p>
      </div>
    );
  }

  return (
    <div className="panel trace-panel">
      {result.selected && (
        <div className="section">
          <h3>Result</h3>
          <div className="result-box">
            <div><span>Route:</span> {result.selected.route}</div>
            <div><span>Service:</span> {result.selected.service}</div>
          </div>
        </div>
      )}

      {result.error && (
        <div className="section">
          <h3>Error</h3>
          <div className="error-box">{result.error}</div>
        </div>
      )}

      <div className="section">
        <h3>Execution Trace</h3>
        <div className="trace-list">
          {result.trace.map((t, i) => (
            <div key={i} className={`trace-item trace-${t.result}`}>
              <span className="trace-num">{i + 1}</span>
              <span className="trace-step">{t.step}</span>
              <span className="trace-result">{t.result}</span>
              <span className="trace-reason">{t.reason}</span>
            </div>
          ))}
        </div>
      </div>

      {result.rejections.length > 0 && (
        <div className="section">
          <h3>Rejection Analysis</h3>
          <div className="rejection-list">
            {result.rejections.map((r, i) => (
              <div key={i} className="rejection-item">
                <span className="rej-route">{r.route}</span>
                <span className="rej-reason">{r.reason}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
