.PHONY: install dev build start lint preview help

# ── Default ────────────────────────────────────────────────────────────────────
help:
	@echo ""
	@echo "  make install   Install Node dependencies"
	@echo "  make dev       Start Next.js dev server (port 3000)"
	@echo "  make build     Production build"
	@echo "  make start     Serve production build (port 3000)"
	@echo "  make lint      Run ESLint"
	@echo ""

# ── Setup ──────────────────────────────────────────────────────────────────────
install:
	npm install

# ── Run ───────────────────────────────────────────────────────────────────────
dev:
	npm run dev

build:
	npm run build

start:
	npm run start

# ── Code quality ──────────────────────────────────────────────────────────────
lint:
	npm run lint
