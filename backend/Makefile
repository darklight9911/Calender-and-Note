.PHONY: install run dev lint format freeze help

PYTHON  ?= python3
VENV    ?= .venv
VENV_PYTHON = $(VENV)/bin/python
VENV_PIP    = $(VENV)/bin/pip
UVICORN  = $(VENV)/bin/uvicorn app.main:app

# ── Default ────────────────────────────────────────────────────────────────────
help:
	@echo ""
	@echo "  make install   Install Python dependencies"
	@echo "  make run       Start server (production mode, port 8000)"
	@echo "  make dev       Start server (auto-reload, port 8000)"
	@echo "  make lint      Run ruff linter"
	@echo "  make format    Run ruff formatter"
	@echo "  make freeze    Pin current deps to requirements.txt"
	@echo ""

# ── Setup ──────────────────────────────────────────────────────────────────────
install:
	$(PYTHON) -m venv $(VENV)
	$(VENV_PIP) install --upgrade pip
	$(VENV_PIP) install -r requirements.txt
	@echo ""
	@echo "  Activate venv: source $(VENV)/bin/activate"
	@echo ""

# ── Run ───────────────────────────────────────────────────────────────────────
kill:
	@lsof -ti:8000 | xargs kill -9 2>/dev/null || true
	@echo "Port 8000 cleared."

dev: kill
	$(UVICORN) --reload --host 0.0.0.0 --port 8000 --loop asyncio

run: kill
	$(UVICORN) --host 0.0.0.0 --port 8000 --workers 2 --loop asyncio

# ── Code quality ──────────────────────────────────────────────────────────────
lint:
	$(VENV_PYTHON) -m ruff check app/

format:
	$(VENV_PYTHON) -m ruff format app/

# ── Deps ──────────────────────────────────────────────────────────────────────
freeze:
	$(VENV_PIP) freeze > requirements.txt
