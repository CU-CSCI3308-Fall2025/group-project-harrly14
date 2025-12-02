# API Reference

Base URL (local): http://localhost:3000  
Session cookie based auth (express-session, stored in Postgres). See session setup in [`src/index.js`](../src/index.js).

---

## Health / Test
- GET /welcome  
  - Public. Used by tests.  
  - Response: 200 JSON
  ```json
  { "status": "success", "message": "Welcome!" }
  ```
  - Implemented: [`src/index.js`](../src/index.js)  
  - Used by tests: [`test/server.spec.js`](../test/server.spec.js)

---

## Authentication / User pages (server-rendered)
Implemented in [`routes.auth`](../src/routes/auth.js)

- GET /register, GET /login, GET /logout, GET /update (pages) — returns rendered views.

- POST /register
  - Body (form): application/x-www-form-urlencoded
    - username, email, password
  - Success: redirect 302 → /login (sets session message)
  - Failure (duplicate): redirect 302 → /register (message)
  - See: [`routes.auth`](../src/routes/auth.js)

- POST /login
  - Body (form): username, password
  - Success: sets `req.session.user = { id, username, email }` and redirects to /home
  - Failure: redirect /login or /register with message
  - See: [`routes.auth`](../src/routes/auth.js)

- GET /logout
  - Destroys session and redirects to /login
  - See: [`routes.auth`](../src/routes/auth.js)

Notes: session secret and behavior are configured in [`src/index.js`](../src/index.js). Use `.env` from [`ProjectSourceCode/.env.example`](../.env.example).

---

## Page routes
Implemented in [`routes.pages`](../src/routes/pages.js)

- GET /home
  - Renders map + exposes `googleApiKey` to client views.
  - Passes `parkingLots` (list for dropdown) from DB.
  - See: [`routes.pages`](../src/routes/pages.js)

---

## Parking lots (GeoJSON)
Implemented in [`routes.parking_lots`](../src/routes/parking_lots.js)

- GET /parking-lots.js
  - Returns GeoJSON FeatureCollection of lots with properties:
    - lot_id, capacity, current_occupancy, (optionally LotNumber, Types)
  - Sample response shape:
  ```json
  {
    "type": "FeatureCollection",
    "features": [
      {
        "type": "Feature",
        "geometry": { /* GeoJSON Polygon / MultiPolygon */ },
        "properties": {
          "lot_id": 203,
          "capacity": 7,
          "current_occupancy": 0,
          "LotNumber": 203,
          "Types": ["Short-term Pay"]
        }
      }
    ]
  }
  ```
  - See: [`routes.parking_lots`](../src/routes/parking_lots.js)

---

## Parking sessions API
Implemented in [`routes.parking_sessions`](../src/routes/parking_sessions.js)

- POST /api/parking-sessions/start
  - Auth required (session cookie)
  - JSON body: { "lotId": 203 }
  - Success: 200 { success: true, message: "Parking session started!" }
  - Failure: 400 with error message (full, full lot, already active session)
  - See: [`routes.parking_sessions`](../src/routes/parking_sessions.js)

- POST /api/parking-sessions/end
  - Auth required
  - JSON body: {}
  - Success: 200 { message: "Parking session ended!" }
  - Failure: 400 if no active session
  - See: [`routes.parking_sessions`](../src/routes/parking_sessions.js)

---

## Users API
Implemented in [`routes.users`](../src/routes/users.js)

- GET /api/users/current-session
  - Auth required
  - Response: 200 { "current_session": true|false }
  - Used by client map UI to set session button text.
  - See: [`routes.users`](../src/routes/users.js)

---

## Availability endpoint
- GET /api/availability/:lotId (implemented in [`src/index.js`](../src/index.js))
  - Auth: none (public).
  - Returns computed available spots as `capacity - current_occupancy`.
  - Success (found): 200 JSON
  ```json
  { "available": 12 }
  ```
  - If lot not found: 404 JSON
  ```json
  { "error": "Lot not found" }
  ```
  - Error: 500 JSON on database errors.

---

## Errors / Status codes
- 200 OK — success
- 201 Created — (not used currently)
- 302 Redirect — auth form flows for register/login
- 400 Bad Request — validation or business rule (e.g. lot full)
- 401 Unauthorized / 302 redirect to /login for protected web pages (implemented by middleware)
- 404 Not Found — missing resource
- 500 Internal Server Error — unexpected failure

---

## Notes for maintainers / tests
- Tests use Mocha/Chai in [`test/server.spec.js`](../test/server.spec.js). They expect `/welcome` and registration behavior.
- DB init scripts live in [`src/init_data`](../src/init_data) and are mounted by Docker Compose: [`docker-compose.yaml`](../docker-compose.yaml).
- App entry: [`src/index.js`](../src/index.js)
- DB config: [`src/config/database.js`](../src/config/database.js)
- npm scripts: see [`package.json`](../package.json)