.PHONY: dev prod build clean

dev:
	@echo "\033[36m================================"
	@echo " RouteLens — Development Mode"
	@echo "================================"
	@echo ""
	@echo " Frontend: http://localhost:5173"
	@echo " Backend:  http://localhost:8080\033[0m"
	@echo ""
	@echo "\033[33mInstalling frontend deps...\033[0m"
	@cd frontend && npm install --silent
	@echo ""
	@echo "\033[32mStarting servers...\033[0m"
	@trap 'kill 0' EXIT; \
		(cd backend && go run ./cmd/server/) & \
		(cd frontend && npm run dev) & \
		wait

prod:
	@echo "\033[36m================================"
	@echo " RouteLens — Production Mode"
	@echo "================================"
	@echo ""
	@echo "\033[33mInstalling frontend deps...\033[0m"
	@cd frontend && npm install --silent
	@echo "\033[33mBuilding frontend...\033[0m"
	@cd frontend && npm run build --silent
	@echo ""
	@echo "\033[32mStarting server at http://localhost:8080\033[0m"
	@echo ""
	@cd backend && go run ./cmd/server/

build:
	@echo "\033[33mBuilding frontend...\033[0m"
	@cd frontend && npm install --silent && npm run build
	@echo "\033[33mBuilding backend binary...\033[0m"
	@cd backend && go build -o ../server ./cmd/server/
	@echo "\033[32mDone! Run ./server to start\033[0m"

clean:
	@rm -rf frontend/node_modules frontend/dist server
	@echo "\033[32mCleaned\033[0m"
