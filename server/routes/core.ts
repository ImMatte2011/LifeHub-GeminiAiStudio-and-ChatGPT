import { Router } from 'express';
import { db } from '../db/database.js';
import { InstanceConfigManager } from '../services/instanceConfig.js';
import { ExtensionManager } from '../services/extensionManager.js';

const router = Router();

// /api/core/modules/active - Core endpoint used by modular frontend to discover active modules
router.get('/modules/active', (req, res) => {
  const activeModules = Array.from(db.modules.values())
    .filter((m) => m.is_enabled)
    .map((m) => {
      const extCheck = ExtensionManager.verifyModuleExtensions(m.required_extensions);
      return {
        ...m,
        extensions_ready: extCheck.satisfied,
        missing_extensions: extCheck.missing,
      };
    });

  return res.json({
    active_modules: activeModules,
    instance_name: db.instanceConfig.instance.name,
    instance_description: db.instanceConfig.instance.description,
  });
});

// List all registered modules (enabled or disabled)
router.get('/modules', (req, res) => {
  const modules = Array.from(db.modules.values()).map((m) => {
    const extCheck = ExtensionManager.verifyModuleExtensions(m.required_extensions);
    return {
      ...m,
      extensions_ready: extCheck.satisfied,
      missing_extensions: extCheck.missing,
    };
  });
  return res.json(modules);
});

// Toggle module state
router.post('/modules/:id/toggle', (req, res) => {
  const { enabled } = req.body;
  const mod = db.modules.get(req.params.id);
  if (!mod) return res.status(404).json({ error: 'Module not found' });

  mod.is_enabled = Boolean(enabled);
  db.instanceConfig.modules[mod.id] = mod.is_enabled;

  db.logAudit(
    'user_admin',
    'CONFIG_CHANGE',
    `Module ${mod.name} was ${mod.is_enabled ? 'enabled' : 'disabled'}`,
    mod.id,
    'module'
  );

  return res.json(mod);
});

// Instance Config Management
router.get('/config', (req, res) => {
  return res.json(InstanceConfigManager.getConfig());
});

router.put('/config', (req, res) => {
  try {
    const updated = InstanceConfigManager.applyConfig(req.body);
    return res.json(updated);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

router.get('/config/yaml', (req, res) => {
  return res.type('text/yaml').send(InstanceConfigManager.getYaml());
});

router.post('/config/yaml', (req, res) => {
  try {
    const yamlString = typeof req.body === 'string' ? req.body : req.body.yaml;
    const updated = InstanceConfigManager.applyConfig(yamlString);
    return res.json(updated);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

router.get('/config/presets', (req, res) => {
  return res.json(InstanceConfigManager.getPresets());
});

// Audit Log
router.get('/audit', (req, res) => {
  const { limit = 100, entity_type, action } = req.query;
  let logs = db.auditLog;
  if (entity_type) {
    logs = logs.filter((l) => l.entity_type === entity_type);
  }
  if (action) {
    logs = logs.filter((l) => l.action === action);
  }
  return res.json(logs.slice(0, Number(limit)));
});

// Backup Export & Import
router.get('/backup/export', (req, res) => {
  const backup = db.exportDatabaseBackup();
  res.setHeader('Content-Disposition', `attachment; filename=lifehub_backup_${Date.now()}.json`);
  return res.json(backup);
});

router.post('/backup/import', (req, res) => {
  try {
    const result = db.importDatabaseBackup(req.body);
    return res.json(result);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// System Operations & Raspberry Pi 4 Diagnostics
router.get('/system/metrics', (req, res) => {
  const uptimeSeconds = Math.floor(process.uptime()) + 86400 * 14; // simulated 14 days host uptime
  const days = Math.floor(uptimeSeconds / 86400);
  const hours = Math.floor((uptimeSeconds % 86400) / 3600);
  const mins = Math.floor((uptimeSeconds % 3600) / 60);

  const metrics = {
    host: {
      platform: 'Linux 6.6.20+rpt-rpi-v8 (aarch64)',
      hardware: 'Raspberry Pi 4 Model B Rev 1.4 (Quad-Core Cortex-A72 @ 1.8GHz)',
      memory_total_mb: 8192,
      memory_used_mb: 1840,
      memory_cached_mb: 950,
      storage_type: 'Kingston A400 480GB SATA III SSD (via USB3 UASP)',
      storage_used_gb: 42.8,
      storage_total_gb: 440.0,
      cpu_temp_celsius: 43.8,
      cpu_load_pct: 12.4,
      uptime: `${days}d ${hours}h ${mins}m`,
      docker_containers_running: 4,
    },
    database: {
      engine: 'PostgreSQL 16.2 on aarch64-linux-gnu',
      extensions_installed: ['postgis 3.4.1', 'pg_trgm 1.6', 'btree_gist 1.7'],
      tables_count: 24,
      total_entities: db.entities.size,
      persons_count: db.people.size,
      places_count: db.places.size,
      events_count: db.events.size,
      knowledge_items_count: db.knowledgeItems.size,
      audit_records_count: db.auditLog.length,
      links_count: db.links.length,
      tags_count: db.tags.size,
    },
  };

  return res.json(metrics);
});

export default router;
