# LifeHub — Monitoring & Telemetry

## 1. System Health Monitoring

LifeHub provides a built-in health check endpoint accessible at `/api/core/health`.

### Response Payload Example:
```json
{
  "status": "healthy",
  "uptime_seconds": 3600,
  "memory": {
    "heap_used_mb": 42.5,
    "heap_total_mb": 68.2,
    "rss_mb": 94.1
  },
  "database": {
    "status": "connected",
    "entities_count": 54,
    "users_count": 3,
    "audit_records": 128
  },
  "active_modules": ["people", "places", "events", "knowledge", "buildings"],
  "active_extensions": ["maps", "pg_trgm"]
}
```

## 2. Resource Budget on Raspberry Pi 4 (8GB)
- **Target CPU Usage**: < 5% during idle, < 25% during graph traversal & spatial queries.
- **Target Memory Limit**: Max 256MB Node container allocation.
- **I/O Optimization**: In-memory write buffering with periodic snapshot flushing to SATA SSD.

## 3. Audit Logging
Every mutation across Core, Modules, and Extensions is logged with:
- Timestamp (ISO 8601)
- User ID & IP Address
- Action Type (`CREATE`, `UPDATE`, `DELETE`, `TOGGLE_MODULE`, `TOGGLE_EXTENSION`, `LOGIN`, `LOGOUT`)
- Entity ID and Changes delta
