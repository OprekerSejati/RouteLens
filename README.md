<div align="center">
  <h1>RouteLens</h1>
  <p><strong>Traffic Decision Debugging System</strong></p>
  <p>Simulate, visualize, and debug Kubernetes Gateway API routing decisions — without touching a single production server.</p>
<p>
  <a href="https://oprekersejati.github.io/RouteLens/">
    <img src="https://img.shields.io/badge/live%20demo-https://oprekersejati.github.io/RouteLens/-success?style=for-the-badge" alt="Live Demo">
  </a>
</p>
  <p>
    <img src="https://img.shields.io/badge/Go-1.23-00ADD8?logo=go" alt="Go 1.23">
    <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react" alt="React 19">
    <img src="https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white" alt="TypeScript">
    <img src="https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white" alt="Vite">
    <img src="https://img.shields.io/badge/license-MIT-green" alt="MIT License">
    <img src="https://img.shields.io/badge/PRs-welcome-brightgreen" alt="PRs Welcome">
    <img src="https://img.shields.io/badge/Envoy%20Gateway%20Aligned-✓-purple" alt="Envoy Gateway Aligned">
  </p>
</div>

---

## Why RouteLens?

**For DevOps & Platform Engineers:** Ever spent hours debugging why a request hit the wrong service? RouteLens makes routing decisions *explainable*. Paste your gateway config, fire a request, and see exactly which route matched (and why others didn't).

**For CEOs & Recruiters:** This is a production-grade simulation engine that mirrors how Envoy Gateway and Kubernetes Gateway API route traffic — built from scratch in Go with a React visualization layer. It demonstrates deep systems thinking, full-stack execution, and engineer-grade problem-solving.

---

## How It Works

```
You: "Where does GET api.example.com/users/123 go?"
RouteLens: Runs an 11-step decision pipeline →
           Normalize → Match Listener → Match VHost →
           Collect Routes → Filter → Rank → Select →
           Execute Filters → Resolve Backend → Pick Endpoint →
           Show you the full trace with reasons
```

## Key Features

### 🧠 Explainable Decision Engine
11-step deterministic pipeline — same input always produces the same output.

| Step | What Happens |
|------|-------------|
| Normalize | Lowercase host/headers, clean path |
| Listener Match | Port + protocol matching |
| VirtualHost Match | Exact > wildcard > longest match |
| Route Match | Path (exact/prefix/regex) + method + headers |
| Negative Trace | Records *why* each route was skipped |
| Rank & Select | Specificity scoring with tie-breakers |
| Filter Execution | Auth, rate limit, rewrite, header mod (stateful) |
| Backend Resolve | Single or weighted (deterministic FNV-1a hash) |
| Endpoint Select | Round-robin per cluster |

### 🔍 Negative Trace™
The killer feature. RouteLens doesn't just tell you what matched — it tells you what *didn't* match and exactly why.

> `admin-route skipped → header mismatch: x-admin expected, not found`

### ⚡ Conflict Detection
Catches configuration problems before they reach production:
- **AMBIGUOUS_ROUTE** — overlapping route conditions
- **DUPLICATE_MATCH** — identical route definitions
- **UNREACHABLE_ROUTE** — defined but never referenced

### 🖥️ Visual Flow Graph (React Flow)
- Custom nodes with state: `active` (blue), `skipped` (gray), `failed` (red)
- Hover edges for decision reason tooltips
- Click any node to jump to its YAML definition
- Step-through mode for presentations and debugging

### 🎛️ Live Config Editor (Monaco)
- YAML syntax highlighting + auto-validation
- Real-time conflict highlighting with debounced API calls
- One-click "Load Example" to get started fast

---

## Quick Start

```bash
make dev
```

```
┌──────────────────────┬─────────────────────┐
│ Frontend (HMR)       │ http://localhost:5173 │
│ Backend (API)        │ http://localhost:8080 │
└──────────────────────┴─────────────────────┘
```

### Production Mode
```bash
make prod
```

```
Server running at http://localhost:8080
```

### Standalone Binary
```bash
make build
./server
```

---

## Architecture

```
┌─────────────┐     ┌──────────────────┐     ┌──────────────┐
│  Request     │     │  Config (YAML)   │     │  Visual Flow │
│  Input Panel │     │  Monaco Editor   │     │  Graph (RF)  │
└──────┬──────┘     └────────┬─────────┘     └──────┬───────┘
       └──────────────────┬──────────────────────────┘
                          │ POST /api/simulate
                          ▼
┌──────────────────────────────────────────────────────────┐
│                   Go Backend Engine                        │
│  Config Loader → Pipeline (11 steps) → Trace + Mutations  │
│                → Conflict Detection                        │
└──────────────────────────────────────────────────────────┘
                          │
                          ▼
                    JSON Result
              (trace, negativeTrace, mutations, warnings)
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Go 1.23, standard library HTTP |
| **Frontend** | React 19, TypeScript, Vite |
| **Editor** | Monaco Editor (VS Code) |
| **Graph** | React Flow |
| **Config** | YAML → canonical model |

---

## Project Structure

```
backend/
  cmd/server/main.go        # Entry point, serves API + static files
  internal/
    api/handler.go           # HTTP handlers (simulate, validate, analyze)
    config/loader.go         # YAML parser
    engine/
      models.go              # All data types
      normalizer.go          # Request normalization
      matcher.go             # Listener/VHost/Route matching
      ranker.go              # Route ranking & tie-breaking
      filter.go              # Filter execution + backend resolution
      pipeline.go            # 11-step orchestration
      trace.go               # Trace utilities
      conflict.go            # Conflict detection
frontend/
  src/
    App.tsx                  # Main layout + state
    components/
      RequestInput.tsx       # Request builder panel
      ConfigPanel.tsx        # Monaco YAML editor
      FlowGraph.tsx          # React Flow visualization
      TracePanel.tsx         # Results viewer
sample/
  01-basic-prefix-routing.yaml     # Simple prefix match
  02-auth-filter.yaml              # Auth + rejection
  03-rewrite-header-mutation.yaml  # Rewrite + header mod
  04-weighted-canary.yaml          # Canary (80/20 weighted)
  05-wildcard-negative-trace.yaml  # Wildcard host + negative trace
  06-rate-limit-edge-cases.yaml    # Rate limit + 404/503
  07-regex-header-complex.yaml     # Regex path + complex headers
Makefile                           # dev, prod, build commands
```

---

## Sample Configs

Jumpstart your exploration with ready-to-use scenarios in `sample/`:

| # | File | What It Shows |
|---|------|---------------|
| 1 | `01-basic-prefix-routing.yaml` | Simple prefix match, multiple endpoints |
| 2 | `02-auth-filter.yaml` | Auth filter — toggle `reject` to see 401 |
| 3 | `03-rewrite-header-mutation.yaml` | Path rewrite + header injection (mutations) |
| 4 | `04-weighted-canary.yaml` | Canary deployment (80/20 weighted routing) |
| 5 | `05-wildcard-negative-trace.yaml` | Wildcard hosts + routes that fail (negative trace) |
| 6 | `06-rate-limit-edge-cases.yaml` | Rate limit rejection + empty cluster 503 |
| 7 | `07-regex-header-complex.yaml` | Regex path + exact/regex header matching |

Open the app, click **Load Example**, then paste one of these configs and hit **Simulate**.

---

## Use Cases

- **Debug routing issues** — see exactly why traffic goes where it goes
- **Validate config changes** — catch conflicts before deploying to production
- **Onboard new engineers** — visualize how your gateway routes traffic
- **Demo / interview** — showcase full-stack systems engineering skills

---

## Test It

```bash
curl -X POST http://localhost:8080/api/simulate \
  -H 'Content-Type: application/json' \
  -d '{
    "request": {"method":"GET","host":"api.example.com","path":"/users/123","headers":{"authorization":"Bearer x"},"port":80,"protocol":"HTTP"},
    "config": "listeners:\n  - name: l1\n    port: 80\n    protocol: HTTP\nvirtualHosts:\n  - name: vh1\n    domains:\n      - api.example.com\n    routes:\n      - r1\nroutes:\n  - id: r1\n    priority: 0\n    createdAt: 1\n    match:\n      path:\n        type: prefix\n        value: /users\n      method:\n        - GET\n      headers: []\n    filters: []\n    backend:\n      type: single\n      clusters:\n        - name: svc\nfilters: []\nclusters:\n  - name: svc\n    endpoints:\n      - pod-1"
  }'
```

---

## Origin

Built as a hands-on deep dive into Kubernetes Gateway API internals — proving that complex infrastructure concepts can be made visual, interactive, and debuggable.

<div align="center">
  <br>
  <img src="https://img.shields.io/badge/built%20with%20%E2%9D%A4%EF%B8%8F%20and%20Go-royalblue" alt="Built with love and Go">
</div>
