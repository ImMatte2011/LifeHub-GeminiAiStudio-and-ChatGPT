# LifeHub — Architecture & Design Blueprint

## 1. Architectural Philosophy & Layering

LifeHub is designed as a decoupled, multi-domain, modular platform suitable for lightweight self-hosted deployments (e.g. Raspberry Pi 4 with 8GB RAM + SATA SSD) as well as modern containerized environments.

```
+-------------------------------------------------------------------------+
|                              FRONTEND PWA                               |
|          React 18 + Vite + Tailwind CSS + Leaflet OSM Maps              |
+-------------------------------------------------------------------------+
                                    |
                            HTTP / REST APIs
                                    v
+-------------------------------------------------------------------------+
|                             BACKEND API                                 |
|                                                                         |
|  +--------------------+  +--------------------+  +-------------------+  |
|  |    CORE LAYER      |  |     META LAYER     |  |   SHARED LAYER    |  |
|  | - Auth & Sessions  |  | - Dynamic Types    |  | - Tags Engine     |  |
|  | - Users & Roles    |  | - Property Defs    |  | - Universal Links |  |
|  | - Instance Config  |  | - Property Groups  |  | - Files & Media   |  |
|  | - Entity Registry  |  |                    |  |                   |  |
|  | - Audit Log        |  |                    |  |                   |  |
|  +--------------------+  +--------------------+  +-------------------+  |
|                                                                         |
|  +-------------------------------------------------------------------+  |
|  |                        EXTENSION MANAGER                          |  |
|  |  - maps bundle (PostGIS + Leaflet + OpenStreetMap)                |  |
|  |  - pg_trgm (Fuzzy Search & Autocomplete)                          |  |
|  +-------------------------------------------------------------------+  |
|                                                                         |
|  +-------------------------------------------------------------------+  |
|  |                        DOMAIN MODULES                             |  |
|  |  - People      - Places      - Events                             |  |
|  |  - Knowledge   - Buildings   - Graph / Timeline                   |  |
|  +-------------------------------------------------------------------+  |
+-------------------------------------------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------+
|                         DATABASE LAYER                                  |
|   PostgreSQL (core, meta, shared, people, places, events, knowledge)    |
+-------------------------------------------------------------------------+
```

## 2. Layer Responsibilities & Strict Rules

1. **CORE**:
   - Manages Users (`core.users`), Roles & Permissions (`core.roles`, `core.role_permissions`), Sessions (`core.sessions`), Settings (`core.settings`), Master Entity Registry (`core.entities`), Module Flags (`core.modules`), and Audit Logs (`core.audit_log`).
   - *Rule*: Core never contains domain-specific tables and does not depend on optional extensions.

2. **META**:
   - Stores schema-less schema descriptors (`meta.entity_types`, `meta.property_definitions`, `meta.property_groups`).
   - *Rule*: Meta describes data dynamically (e.g., dynamic Knowledge items) but never creates DDL tables dynamically.

3. **SHARED**:
   - Cross-domain utilities available to any entity (`shared.tags`, `shared.entity_tags`, `shared.link_types`, `shared.links`, `shared.files`, `shared.entity_files`).

4. **EXTENSIONS & EXTENSION MANAGER**:
   - Optional technical infrastructure capabilities.
   - *Rule*: Extensions do not know what modules use them. Modules declare requirements (`requires: ['maps']`).

5. **DOMAIN MODULES**:
   - Standard domain entities (`people.persons`, `places.places`, `events.events`, `knowledge.items`, `buildings.buildings`).
   - Every domain entity has a PK that is also an FK pointing to `core.entities.id`.

## 3. Instance Configuration (`instance.yaml`)

```yaml
instance:
  name: "LifeHub"
  description: "Personal & Domain Knowledge Hub"

modules:
  people: true
  places: true
  events: true
  knowledge: true
  buildings: true

extensions:
  maps: true
  pg_trgm: true
```
