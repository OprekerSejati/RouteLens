import type { Request, Method, Protocol } from '../types';

interface Props {
  request: Request;
  onChange: (req: Request) => void;
}

const METHODS: Method[] = ['GET', 'POST', 'PUT', 'DELETE'];
const PROTOCOLS: Protocol[] = ['HTTP', 'HTTPS'];

export default function RequestInput({ request, onChange }: Props) {
  const update = (partial: Partial<Request>) => onChange({ ...request, ...partial });

  return (
    <div className="panel request-input">
      <h3>Request Input</h3>
      <div className="form-row">
        <label>Method</label>
        <select value={request.method} onChange={e => update({ method: e.target.value as Method })}>
          {METHODS.map(m => <option key={m}>{m}</option>)}
        </select>
      </div>
      <div className="form-row">
        <label>Host</label>
        <input value={request.host} onChange={e => update({ host: e.target.value })} placeholder="api.example.com" />
      </div>
      <div className="form-row">
        <label>Path</label>
        <input value={request.path} onChange={e => update({ path: e.target.value })} placeholder="/users/123" />
      </div>
      <div className="form-row">
        <label>Port</label>
        <input type="number" value={request.port} onChange={e => update({ port: parseInt(e.target.value) || 80 })} />
      </div>
      <div className="form-row">
        <label>Protocol</label>
        <select value={request.protocol} onChange={e => update({ protocol: e.target.value as Protocol })}>
          {PROTOCOLS.map(p => <option key={p}>{p}</option>)}
        </select>
      </div>
      <div className="form-section">
        <label>Headers</label>
        {Object.entries(request.headers).map(([k, v], i) => (
          <div key={i} className="form-row header-row">
            <input value={k} onChange={e => {
              const h = { ...request.headers };
              delete h[k];
              h[e.target.value] = v;
              update({ headers: h });
            }} placeholder="key" />
            <input value={v} onChange={e => {
              const h = { ...request.headers, [k]: e.target.value };
              update({ headers: h });
            }} placeholder="value" />
            <button className="btn-small" onClick={() => {
              const h = { ...request.headers };
              delete h[k];
              update({ headers: h });
            }}>x</button>
          </div>
        ))}
        <button className="btn-add" onClick={() => update({ headers: { ...request.headers, '': '' } })}>
          + Add Header
        </button>
      </div>
    </div>
  );
}
