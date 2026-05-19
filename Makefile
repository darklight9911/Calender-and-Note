.PHONY: install dev stop help

# ── Default ────────────────────────────────────────────────────────────────────
help:
	@echo ""
	@echo "  make install   Install all dependencies (backend + frontend)"
	@echo "  make dev       Run backend + frontend concurrently"
	@echo ""

# ── Setup ──────────────────────────────────────────────────────────────────────
install:
	$(MAKE) -C backend install
	$(MAKE) -C frontend install

# ── Dev (both services) ───────────────────────────────────────────────────────
dev:
	@echo "Starting backend on :8000 and frontend on :3000 ..."
	@trap 'kill 0' INT; \
	  $(MAKE) -C backend dev & \
	  $(MAKE) -C frontend dev & \
	  wait
