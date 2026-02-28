# The Forum — Setup Guide

A Turborepo monorepo with:
- **`apps/web`** — Next.js 15 (App Router, Turbopack)
- **`apps/database`** — Drizzle ORM + PostgreSQL
- **`backends/fastapi`** — FastAPI (Python 3.12+)

---

## Prerequisites

### All platforms

| Tool | Version | Install |
|------|---------|---------|
| [Bun](https://bun.sh) | ≥ 1.2 | `curl -fsSL https://bun.sh/install \| bash` |
| [Docker Desktop](https://www.docker.com/products/docker-desktop/) | latest | Download from docker.com |
| [uv](https://docs.astral.sh/uv/) | ≥ 0.5 | `curl -LsSf https://astral.sh/uv/install.sh \| sh` |
| [Git](https://git-scm.com) | ≥ 2.40 | Pre-installed on Mac; `winget install Git.Git` on Windows |

### macOS specifics

```bash
# Install Homebrew if not present
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Bun
curl -fsSL https://bun.sh/install | bash

# Install uv
curl -LsSf https://astral.sh/uv/install.sh | sh
```

### Windows specifics

```powershell
# Install Bun (PowerShell, run as Administrator)
powershell -c "irm bun.sh/install.ps1 | iex"

# Install uv (PowerShell)
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"

# Ensure Git Bash or WSL2 is available (recommended for shell scripts)
winget install Git.Git
```

> **Windows tip:** For the best experience use [WSL2](https://learn.microsoft.com/en-us/windows/wsl/install)
> or Git Bash for all commands below.

---

## 1 — Clone & Install JS dependencies

```bash
git clone https://github.com/DIodide/TheForum.git
cd TheForum

# Installs all JS/TS workspace packages and sets up Husky pre-commit hooks
bun install
```

---

## 2 — Environment Variables

Copy the example files and fill in your values:

```bash
# Root .env (used by docker-compose)
cp .env.example .env

# Database package .env (used by drizzle-kit CLI)
cp apps/database/.env.example apps/database/.env

# Next.js local env
cp apps/web/.env.local.example apps/web/.env.local

# FastAPI env
cp backends/fastapi/.env.example backends/fastapi/.env
```

The defaults in `.env.example` work as-is for local Docker development.

---

## 3 — Start the Database (Docker)

```bash
# Start PostgreSQL container in the background
bun run db:up

# Verify it's running
docker compose ps

# Check logs if needed
bun run db:logs
```

The database is reachable at `postgresql://forum:forum_password@localhost:5432/the_forum`.

### Run migrations

```bash
# From the repo root — generates SQL migrations from schema changes
bun run db:generate   # runs via turbo → apps/database

# Apply migrations
bun run db:migrate

# OR for rapid dev iteration (push schema directly, no migration files)
bun run db:push
```

### Drizzle Studio (visual DB browser)

```bash
cd apps/database
bun run db:studio
```

---

## 4 — Install Python dependencies

```bash
cd backends/fastapi

# uv creates a .venv automatically and installs all deps
uv sync
```

This works identically on Mac, Linux, and Windows.

---

## 5 — Run all dev servers

From the repo root:

```bash
bun run dev
```

This starts (in parallel via Turborepo):

| Service | URL |
|---------|-----|
| Next.js (web) | http://localhost:3000 |
| FastAPI | http://localhost:8000 |
| FastAPI docs | http://localhost:8000/docs |

### Run a single service

```bash
# Web only
cd apps/web && bun run dev

# FastAPI only
cd backends/fastapi && bun run dev
# or directly:
cd backends/fastapi && uv run uvicorn app.main:app --reload --port 8000
```

---

## 6 — Linting & Formatting

[Biome](https://biomejs.dev) handles JS/TS linting and formatting.

```bash
# Lint + format all JS/TS files (auto-fix)
bun run check

# Format only
bun run format

# Check without fixing
bunx biome check .
```

Pre-commit hooks run automatically on `git commit` (via Husky + lint-staged),
enforcing Biome on all staged JS/TS/JSON/CSS files.

For Python, use Ruff (already in dev dependencies):

```bash
cd backends/fastapi
uv run ruff check .          # lint
uv run ruff format .         # format
```

---

## 7 — Stopping services

```bash
# Stop the database container (data persisted in Docker volume)
bun run db:down

# Stop + destroy all data
docker compose down -v
```

---

## Troubleshooting

### `DATABASE_URL` not found
Make sure you copied the `.env.example` files (step 2) and that the database
container is running (`bun run db:up`).

### Port 5432 already in use
Another PostgreSQL instance is running locally. Either stop it, or change
`POSTGRES_PORT` in your root `.env` (e.g. `POSTGRES_PORT=5433`) and update
`DATABASE_URL` accordingly.

### `uv: command not found` on Windows
Restart your terminal after installing uv so the PATH update takes effect.
On PowerShell you may need: `$env:PATH += ";$env:USERPROFILE\.cargo\bin"`.

### Husky hooks not running
Run `bun install` again from the repo root — the `prepare` script re-installs
the hooks. If using WSL2, make sure you're running git from inside WSL.

### `bun run dev` doesn't start FastAPI
Ensure Python dependencies are installed (`cd backends/fastapi && uv sync`)
and that `uv` is on your PATH.
