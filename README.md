# Pulse

Pulse is a Spotify listening analytics platform built with React, FastAPI, PostgreSQL, Redis, Celery, and Docker Compose. It describes music listening patterns only; it does not make medical or mental-health claims.

## Run Pulse locally

### Prerequisites

- Docker Desktop with Docker Compose
- A Spotify Developer application

### Configure Spotify and the application

Pulse reads settings from the root [`.env`](./.env) file. Keep the existing database and application settings, replacing all development secrets before deployment. Add these Spotify settings:

```dotenv
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
SPOTIFY_REDIRECT_URI=http://localhost:8000/api/v1/spotify/callback
REDIS_URL=redis://redis:6379/0
```

In the Spotify Developer Dashboard, add the exact same callback URL to the application's Redirect URI allowlist. The URI must match character-for-character.

### Start the stack

```bash
docker compose up --build
```

Docker Compose starts PostgreSQL, Redis, FastAPI, the React frontend, a Celery worker, and Celery Beat. The `prestart` service runs Alembic migrations before the API and worker start.

Local endpoints:

- Frontend: <http://localhost:5173>
- API docs: <http://localhost:8000/docs>
- Adminer: <http://localhost:8080>
- Mailcatcher: <http://localhost:1080>

### Connect Spotify

After signing in to Pulse, send the authenticated user to `GET /api/v1/spotify/authorize`. Pulse redirects to Spotify, validates the callback state, stores the account identity and credentials, then returns the browser to `/settings`.

To inspect the connection without exposing credentials, call `GET /api/v1/spotify/status` with the Pulse bearer token. To remove stored Spotify credentials, call `DELETE /api/v1/spotify/connection`.

### Background sync

Celery Beat queues `app.tasks.spotify_sync.sync_all_spotify_users` every six hours. The worker refreshes expiring Spotify access tokens, retrieves each connected user's recently played tracks, ignores duplicate play events, and advances `last_sync` only after a successful transaction.

Set `SPOTIFY_SYNC_INTERVAL_HOURS` in `.env` to change the interval for a non-production environment. Review worker and scheduler activity with:

```bash
docker compose logs -f worker beat
```

### Track analysis

Pulse stores energy, valence, danceability, tempo, confidence, and a music-characteristic label per play event. The current Spotify Web API restricts Audio Features and Audio Analysis for new applications, so Pulse does not invent these values from titles, artists, or listener behavior. Supply feature vectors through an approved provider before enabling analysis ingestion. See Spotify's [Web API change announcement](https://developer.spotify.com/blog/2024-11-27-changes-to-the-web-api) for the access restriction.

### Run the backend tests

The production image deliberately excludes test sources, so mount them when running tests. In PowerShell:

```powershell
docker compose run --rm -v "${PWD}/backend/tests:/app/backend/tests" backend pytest tests/
```

### Architecture

```text
React frontend -> FastAPI API -> PostgreSQL
                       |
                       +-> Spotify OAuth and Web API

Celery Beat -> Redis -> Celery worker -> Spotify history sync -> PostgreSQL
```

The FastAPI API remains stateless. Celery Beat schedules work, Redis brokers it, and the worker executes it outside web request processes. Track events are deduplicated at both application and database levels.
