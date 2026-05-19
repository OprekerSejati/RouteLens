#!/usr/bin/env bash
set -e

MODE="${1:-dev}"

case "$MODE" in
  dev)
    echo "================================"
    echo " RouteLens — Development Mode"
    echo "================================"
    echo ""
    echo "  Frontend:  http://localhost:5173"
    echo "  Backend:   http://localhost:8080"
    echo ""

    echo "[1/2] Installing frontend deps..."
    (cd frontend && npm install --silent)

    echo "[2/2] Starting servers..."
    echo ""
    echo "Press Ctrl+C to stop both servers"
    echo ""

    cleanup() {
      echo ""
      echo "Shutting down..."
      kill 0 2>/dev/null
      exit 0
    }
    trap cleanup SIGINT SIGTERM

    cd backend && go run ./cmd/server/ &
    (cd frontend && npm run dev) &
    wait
    ;;

  prod)
    echo "================================"
    echo " RouteLens — Production Mode"
    echo "================================"
    echo ""

    echo "[1/2] Installing frontend deps..."
    (cd frontend && npm install --silent)
    echo "[2/2] Building frontend..."
    (cd frontend && npm run build --silent)
    echo ""
    echo "  Server:  http://localhost:8080"
    echo ""
    cd backend && go run ./cmd/server/
    ;;

  build)
    echo "[1/2] Building frontend..."
    (cd frontend && npm install --silent && npm run build)
    echo "[2/2] Building backend binary..."
    (cd backend && go build -o ../server ./cmd/server/)
    echo ""
    echo "  Done! Run ./server to start"
    ;;

  clean)
    rm -rf frontend/node_modules frontend/dist server
    echo "Cleaned"
    ;;

  *)
    echo "Usage: ./run.sh [dev|prod|build|clean]"
    echo "  dev    — run backend + frontend with hot reload (default)"
    echo "  prod   — build frontend, serve everything from backend"
    echo "  build  — build standalone binary"
    echo "  clean  — remove node_modules, dist, binary"
    exit 1
    ;;
esac
