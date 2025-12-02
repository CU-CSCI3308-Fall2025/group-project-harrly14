This file contains copy‑paste commands for common setup and troubleshooting tasks. See the project README for full context.

Prerequisites
- Docker + Docker Compose (recommended)
- Node.js (if running locally without Docker)
- A Google Maps API key (for map features)

1) Create env file
cp .env.example .env
Edit `.env` with database credentials, SESSION_SECRET, and API_KEY.
([.env.example](../.env.example))

2) Run with Docker (recommended)
docker compose up --build

- The Postgres container mounts SQL files from `src/init_data` so the DB schema and sample data are applied on first startup:
  - [src/init_data/00_create.sql](../src/init_data/00_create.sql)
  - [src/init_data/01_insert_parking_lots.sql](../src/init_data/01_insert_parking_lots.sql)  
- To reset DB and re-run init scripts:
  docker compose down -v
  docker compose up --build

3) Run locally (no Docker)
- Ensure Postgres is running and env vars point to it.
- Install deps:
  npm ci
- Start in dev mode:
  npm run dev
- Start normally:
  npm start

4) Run tests
- Locally (requires DB configured):
  npm test
- In Docker: set `RUN_TESTS=true` in `.env` and `docker compose up --build`. The compose command checks `RUN_TESTS` and will run tests during container startup.

5) Seed / re-seed data
- The init SQL files in `src/init_data` are used by the DB container at initialization.
- To force re-seed: `docker compose down -v` then `docker compose up --build`.

6) Troubleshooting
- If map fails to load, ensure `API_KEY` set in `.env`.
- If DB connection fails, check `docker ps` and container logs: `docker-compose logs db`.
- If port 3000 in use, adjust `ports` in [docker-compose.yaml](../docker-compose.yaml).

7) Useful locations
- App entry: [src/index.js](../src/index.js)  
- Init SQL folder: [src/init_data](../src/init_data)  
- Tests: [test/server.spec.js](../test/server.spec.js)  
- npm scripts: [package.json](../package.json)
