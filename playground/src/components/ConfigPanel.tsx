import type { Config, RouteConfig } from '../engine/types';

interface Props {
  config: Config;
  onChange: (c: Config) => void;
  onReset: () => void;
}

export default function ConfigPanel({ config, onChange, onReset }: Props) {
  const textValue = config.routes
    .map(r => `${r.type === 'exact' ? '=' : '^'} ${r.path} → ${r.service}`)
    .join('\n');

  const handleEdit = (val: string) => {
    const lines = val.split('\n').filter(l => l.trim());
    const routes: RouteConfig[] = lines.map(line => {
      const parts = line.split('→').map(s => s.trim());
      const prefix = parts[0]?.[0];
      const path = parts[0]?.slice(2)?.trim() || '/';
      return {
        type: prefix === '=' ? 'exact' : 'prefix',
        path,
        service: parts[1] || 'unknown',
      };
    });
    onChange({ routes });
  };

  return (
    <div className="panel config-panel">
      <h3>Config</h3>
      <textarea
        className="config-textarea"
        value={textValue}
        onChange={e => handleEdit(e.target.value)}
        spellCheck={false}
      />
      <div className="config-hint">
        <code>^ /path → service</code> prefix &nbsp;|&nbsp; <code>= /path → service</code> exact
      </div>
      <button className="btn-small" onClick={onReset}>Reset to Example</button>
    </div>
  );
}
