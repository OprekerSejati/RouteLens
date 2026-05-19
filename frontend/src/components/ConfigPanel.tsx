import { useRef, useCallback, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
type OnMount = NonNullable<Parameters<typeof Editor>[0]['onMount']>;

interface Props {
  value: string;
  onChange: (val: string) => void;
  highlightLine?: number | null;
  errors?: Array<{ line: number; message: string }>;
}

const DEFAULT_CONFIG = `listeners:
  - name: listener-1
    port: 80
    protocol: HTTP
    hostnames:
      - api.example.com
      - "*.example.com"

virtualHosts:
  - name: vh-1
    domains:
      - api.example.com
    routes:
      - users-route
      - admin-route

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
    filters:
      - auth-filter
    backend:
      type: single
      clusters:
        - name: users-service

  - id: admin-route
    priority: 1
    createdAt: 1001
    match:
      path:
        type: prefix
        value: /admin
      method:
        - GET
        - POST
      headers: []
    filters: []
    backend:
      type: weighted
      clusters:
        - name: admin-v1
          weight: 80
        - name: admin-v2
          weight: 20

filters:
  - id: auth-filter
    type: auth
    config:
      reject: false

clusters:
  - name: users-service
    endpoints:
      - users-pod-1
      - users-pod-2
  - name: admin-v1
    endpoints:
      - admin-v1-pod-1
  - name: admin-v2
    endpoints:
      - admin-v2-pod-1
`;

const THEME = 'routeLensDark';

export default function ConfigPanel({ value, onChange, highlightLine, errors }: Props) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  const handleMount: OnMount = useCallback((editorInstance, monaco) => {
    editorRef.current = editorInstance;

    monaco.editor.defineTheme(THEME, {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'key', foreground: '7dd3fc' },
        { token: 'string', foreground: 'a5b4fc' },
        { token: 'number', foreground: 'f59e0b' },
        { token: 'type', foreground: '6ee7b7' },
      ],
      colors: {
        'editor.background': '#0f172a',
        'editor.foreground': '#e2e8f0',
        'editorLineNumber.foreground': '#475569',
        'editorLineNumber.activeForeground': '#94a3b8',
        'editor.selectionBackground': '#334155',
        'editorCursor.foreground': '#6366f1',
        'editor.lineHighlightBackground': '#1e293b',
        'editorBracketMatch.background': '#1e293b',
        'editorBracketMatch.border': '#475569',
        'editorWidget.background': '#1e293b',
        'editorWidget.border': '#334155',
        'minimap.background': '#0f172a',
      },
    });
    monaco.editor.setTheme(THEME);

    editorInstance.onDidChangeModelContent(() => {
      onChange(editorInstance.getValue());
    });
  }, [onChange]);

  useEffect(() => {
    const ed = editorRef.current;
    if (!ed) return;

    const model = ed.getModel();
    if (!model) return;

    const monaco = (window as any).monaco;
    if (!monaco) return;

    if (highlightLine != null) {
      ed.revealLineInCenter(highlightLine);
      ed.setSelection(new monaco.Selection(highlightLine, 1, highlightLine, 1));
    }
  }, [highlightLine]);

  useEffect(() => {
    const ed = editorRef.current;
    if (!ed) return;

    const model = ed.getModel();
    if (!model) return;

    const monaco = (window as any).monaco;
    if (!monaco) return;

    if (errors && errors.length > 0) {
      monaco.editor.setModelMarkers(model, 'config', errors.map(e => ({
        severity: monaco.MarkerSeverity.Error,
        startLineNumber: e.line,
        startColumn: 1,
        endLineNumber: e.line,
        endColumn: 1000,
        message: e.message,
      })));
    } else {
      monaco.editor.setModelMarkers(model, 'config', []);
    }
  }, [errors]);

  return (
    <div className="panel config-panel">
      <h3>Config (YAML)</h3>
      <Editor
        height="100%"
        defaultLanguage="yaml"
        value={value || DEFAULT_CONFIG}
        theme={THEME}
        onMount={handleMount}
        options={{
          minimap: { enabled: true, scale: 0.5 },
          fontSize: 12,
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          padding: { top: 8 },
          renderWhitespace: 'selection',
          bracketPairColorization: { enabled: true },
          wordWrap: 'off',
        }}
      />
      <div className="config-actions">
        <button className="btn-small" onClick={() => {
          if (editorRef.current) {
            editorRef.current.setValue(DEFAULT_CONFIG);
          }
        }}>Load Example</button>
      </div>
    </div>
  );
}

export { DEFAULT_CONFIG };
