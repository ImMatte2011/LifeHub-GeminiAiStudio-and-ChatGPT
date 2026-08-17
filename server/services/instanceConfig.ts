import * as yaml from 'js-yaml';
import { db } from '../db/database.js';
import { InstanceConfig } from '../db/types.js';
import { ExtensionManager } from './extensionManager.js';

export class InstanceConfigManager {
  /**
   * Get current active instance configuration as object
   */
  static getConfig(): InstanceConfig {
    return db.instanceConfig;
  }

  /**
   * Export config as YAML string (as requested in Phase 1)
   */
  static getYaml(): string {
    return yaml.dump(db.instanceConfig, { indent: 2 });
  }

  /**
   * Apply updated configuration from YAML or JSON object
   */
  static applyConfig(newConfig: Partial<InstanceConfig> | string, userId = 'user_admin'): InstanceConfig {
    let parsed: InstanceConfig;

    if (typeof newConfig === 'string') {
      try {
        parsed = yaml.load(newConfig) as InstanceConfig;
      } catch (err: any) {
        throw new Error(`YAML Parse Error: ${err.message}`);
      }
    } else {
      parsed = newConfig as InstanceConfig;
    }

    if (!parsed || !parsed.instance || !parsed.modules) {
      throw new Error('Invalid instance configuration: missing instance or modules schema');
    }

    // Update instance metadata
    if (parsed.instance) {
      db.instanceConfig.instance = {
        ...db.instanceConfig.instance,
        ...parsed.instance,
      };
    }

    // Update module states
    if (parsed.modules) {
      for (const [moduleId, isEnabled] of Object.entries(parsed.modules)) {
        const mod = db.modules.get(moduleId);
        if (mod) {
          mod.is_enabled = Boolean(isEnabled);
        }
        db.instanceConfig.modules[moduleId] = Boolean(isEnabled);
      }
    }

    // Update extension states via ExtensionManager
    if (parsed.extensions) {
      for (const [extCode, isEnabled] of Object.entries(parsed.extensions)) {
        try {
          ExtensionManager.toggleExtension(extCode, Boolean(isEnabled), userId);
        } catch {
          // Extension might not exist, silently record
          db.instanceConfig.extensions[extCode] = Boolean(isEnabled);
        }
      }
    }

    // Update settings
    if (parsed.settings) {
      db.instanceConfig.settings = {
        ...db.instanceConfig.settings,
        ...parsed.settings,
      };
    }

    db.logAudit(
      userId,
      'CONFIG_CHANGE',
      `Updated instance configuration: ${db.instanceConfig.instance.name}`,
      undefined,
      'config',
      { config: db.instanceConfig }
    );

    return db.instanceConfig;
  }

  /**
   * Get built-in presets demonstrating modularity
   */
  static getPresets() {
    return {
      'second-brain': {
        name: 'Second Brain (All Modules)',
        yaml: `# LifeHub Instance Config - Complete Second Brain
instance:
  name: "LifeHub — Personal Second Brain"
  description: "Unified knowledge, contacts, places, and events platform"
  host_env: "Raspberry Pi 4 (8GB RAM / SATA III SSD)"

modules:
  people: true
  places: true
  events: true
  knowledge: true
  buildings: false

extensions:
  maps: true
  pg_trgm: true

settings:
  multi_user_enabled: true
  default_role: "member"
`,
      },
      'minimal-crm': {
        name: 'Personal CRM & Network',
        yaml: `# LifeHub Instance Config - Minimal CRM
instance:
  name: "LifeHub — Personal CRM"
  description: "Lightweight contacts, relationships, and interaction notes"
  host_env: "Raspberry Pi 4 (8GB RAM)"

modules:
  people: true
  places: false
  events: true
  knowledge: false
  buildings: false

extensions:
  maps: false
  pg_trgm: true

settings:
  multi_user_enabled: false
`,
      },
      'knowledge-base': {
        name: 'Knowledge & Inventory Catalog',
        yaml: `# LifeHub Instance Config - Knowledge & Items
instance:
  name: "LifeHub — Knowledge Catalog"
  description: "Meta-driven dynamic schemas for books, gear, software, recipes"
  host_env: "Raspberry Pi 4 (8GB RAM)"

modules:
  people: false
  places: false
  events: false
  knowledge: true
  buildings: false

extensions:
  maps: false
  pg_trgm: true

settings:
  multi_user_enabled: true
`,
      },
      'facility-assets': {
        name: 'Facility & Asset Management (Phase 12 Demo)',
        yaml: `# LifeHub Instance Config - Facility & Reusability Demo
instance:
  name: "LifeHub — Facilities & Infrastructure"
  description: "Buildings, labs, places, and personnel asset management"
  host_env: "Raspberry Pi 4 (8GB RAM)"

modules:
  people: true
  places: true
  events: true
  knowledge: true
  buildings: true

extensions:
  maps: true
  pg_trgm: true

settings:
  multi_user_enabled: true
`,
      },
    };
  }
}
