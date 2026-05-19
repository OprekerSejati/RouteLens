import type { Request, Method } from '../engine/types';

interface Props {
  request: Request;
  onChange: (r: Request) => void;
}

const METHODS: Method[] = ['GET', 'POST', 'PUT', 'DELETE'];

export default function RequestPanel({ request, onChange }: Props) {
  return (
    <div className="panel">
      <h3>Request</h3>
      <div className="form-row">
        <label>Method</label>
        <select value={request.method} onChange={e => onChange({ ...request, method: e.target.value as Method })}>
          {METHODS.map(m => <option key={m}>{m}</option>)}
        </select>
      </div>
      <div className="form-row">
        <label>Host</label>
        <input value={request.host} onChange={e => onChange({ ...request, host: e.target.value })} />
      </div>
      <div className="form-row">
        <label>Path</label>
        <input value={request.path} onChange={e => onChange({ ...request, path: e.target.value })} />
      </div>
    </div>
  );
}
