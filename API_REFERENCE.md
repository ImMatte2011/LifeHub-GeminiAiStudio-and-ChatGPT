# LifeHub — REST API Reference

All endpoints return standard JSON responses and support session/token authentication.

## 1. Core Endpoints
- `GET /api/core/health` — System health, active module count, memory and uptime.
- `GET /api/core/auth/me` — Current authenticated session and user details.
- `POST /api/core/auth/login` — Authenticate with email and password.
- `POST /api/core/auth/logout` — Invalidate current session.
- `GET /api/core/users` — List users (Admin only).
- `POST /api/core/users` — Create user with assigned role (Admin only).
- `PATCH /api/core/users/:id/disable` — Toggle user enabled/disabled state.
- `GET /api/core/modules` — List all registered modules and their active states.
- `POST /api/core/modules/:id/toggle` — Enable or disable a domain module.
- `GET /api/core/audit` — Query audit logs with pagination and filters.
- `GET /api/core/backup/export` — Full database JSON snapshot.
- `POST /api/core/backup/import` — Restore full database snapshot.
- `GET /api/core/config/yaml` — Export current instance.yaml.
- `POST /api/core/config/yaml` — Update instance configuration via YAML.

## 2. Shared & Meta Services
- `GET /api/meta/types` — List dynamic entity types (e.g. `book`, `ammo`, `software`, `recipe`).
- `GET /api/meta/types/:id` — Get entity type definition and dynamic property definitions.
- `GET /api/shared/tags` — List all universal tags.
- `POST /api/shared/tags` — Create a new tag.
- `GET /api/shared/link-types` — List registered relationship link types.
- `POST /api/shared/links` — Create a bidirectional cross-entity relationship link.
- `GET /api/shared/graph` — Get graph topology of all entities and links.
- `GET /api/shared/timeline` — Consolidated chronology feed across all active modules.

## 3. Global Search & Extensions
- `GET /api/search?q=:query&module_name=:mod&tag_id=:tag` — Full-text + Trigram search with ranking.
- `GET /api/extensions` — List available and active extensions (e.g. `maps`, `pg_trgm`).
- `POST /api/extensions/:id/toggle` — Toggle extension state.

## 4. Domain Modules
- **People**: `GET /api/people`, `POST /api/people`, `GET /api/people/:id`, `PUT /api/people/:id`, `DELETE /api/people/:id`.
- **Places**: `GET /api/places`, `POST /api/places`, `GET /api/places/:id`, `GET /api/places/spatial/radius?lat=&lng=&radius_km=`.
- **Events**: `GET /api/events`, `POST /api/events`, `GET /api/events/:id`.
- **Knowledge**: `GET /api/knowledge`, `POST /api/knowledge`, `GET /api/knowledge/:id`.
- **Buildings**: `GET /api/buildings`, `POST /api/buildings`, `GET /api/buildings/:id`.
