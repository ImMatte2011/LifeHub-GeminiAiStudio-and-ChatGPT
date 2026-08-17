# LifeHub — Operations & Maintenance Manual

## 1. Running on Self-Hosted Hardware (e.g. Raspberry Pi 4)

LifeHub is designed for high memory efficiency and low I/O pressure:
- Total RAM footprint: ~120MB (Node.js/Vite full-stack engine)
- Recommended: Raspberry Pi 4 (4GB or 8GB RAM) with Ubuntu Server / Raspberry Pi OS 64-bit and an attached USB 3.0 SATA III SSD.

## 2. Docker & Container Deployment

Start the stack with:
```bash
docker compose up -d
```

### Environment Variables
Configure `.env`:
```env
PORT=3000
NODE_ENV=production
INSTANCE_CONFIG_PATH=./instance.yaml
```

## 3. Database Backup & Restore Procedures

### Automated Backup via API
- **Export Snapshot**: `GET /api/core/backup/export`
- **Import Snapshot**: `POST /api/core/backup/import` with JSON payload.
- **YAML Config Sync**: `GET /api/core/config/yaml` and `POST /api/core/config/yaml`.

### Manual CLI Snapshot
```bash
# Export all entities and relationships
curl -s http://localhost:3000/api/core/backup/export > backup_$(date +%F).json

# Restore snapshot
curl -X POST -H "Content-Type: application/json" -d @backup_2026-08-16.json http://localhost:3000/api/core/backup/import
```

## 4. Module & Extension Lifecycle
- Disabling a module (via `instance.yaml` or UI) does **NOT** delete underlying data.
- Re-enabling a module immediately brings all entities and relationships back online.
