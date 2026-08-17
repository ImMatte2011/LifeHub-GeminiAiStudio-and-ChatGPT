import { db } from '../db/database.js';
import { TechnicalExtension } from '../db/types.js';

export interface ExtensionCapabilityReport {
  extension: TechnicalExtension;
  is_available: boolean;
  sub_components_status?: { code: string; active: boolean }[];
  consumers_count?: number;
}

export class ExtensionManager {
  /**
   * List all registered extensions in the system
   */
  static listExtensions(): TechnicalExtension[] {
    return Array.from(db.extensions.values());
  }

  /**
   * Get an extension by code
   */
  static getExtension(code: string): TechnicalExtension | undefined {
    for (const ext of db.extensions.values()) {
      if (ext.code === code) return ext;
    }
    return undefined;
  }

  /**
   * Check if a required extension capability is enabled and ready
   */
  static isExtensionAvailable(code: string): boolean {
    const ext = this.getExtension(code);
    if (!ext) return false;
    if (!ext.is_enabled) return false;

    // If composite (like 'maps'), ensure subcomponents are enabled
    if (ext.type === 'composite' && ext.sub_components) {
      for (const subCode of ext.sub_components) {
        const subExt = this.getExtension(subCode);
        if (subExt && !subExt.is_enabled) return false;
      }
    }
    return true;
  }

  /**
   * Enable or disable an extension
   */
  static toggleExtension(code: string, enabled: boolean, userId = 'user_admin'): TechnicalExtension {
    const ext = this.getExtension(code);
    if (!ext) {
      throw new Error(`Extension ${code} not found`);
    }

    ext.is_enabled = enabled;
    ext.status = enabled ? 'active' : 'disabled';

    // If composite toggled, update sub-components
    if (ext.type === 'composite' && ext.sub_components) {
      for (const subCode of ext.sub_components) {
        const sub = this.getExtension(subCode);
        if (sub) {
          sub.is_enabled = enabled;
          sub.status = enabled ? 'active' : 'disabled';
        }
      }
    }

    // Also update instanceConfig
    db.instanceConfig.extensions[code] = enabled;

    db.logAudit(
      userId,
      'EXTENSION_TOGGLE',
      `Extension ${ext.name} (${ext.code}) was ${enabled ? 'enabled' : 'disabled'}`,
      ext.id,
      'extension',
      { code, enabled }
    );

    return ext;
  }

  /**
   * Verify whether a module's required extensions are satisfied
   */
  static verifyModuleExtensions(requiredExtensions: string[]): {
    satisfied: boolean;
    missing: string[];
  } {
    const missing: string[] = [];
    for (const req of requiredExtensions) {
      if (!this.isExtensionAvailable(req)) {
        missing.push(req);
      }
    }
    return {
      satisfied: missing.length === 0,
      missing,
    };
  }

  /**
   * Generate comprehensive diagnostic status report
   */
  static getDiagnosticReport(): ExtensionCapabilityReport[] {
    return this.listExtensions().map((ext) => {
      let subComponentsStatus: { code: string; active: boolean }[] | undefined;
      if (ext.sub_components) {
        subComponentsStatus = ext.sub_components.map((subCode) => {
          const sub = this.getExtension(subCode);
          return {
            code: subCode,
            active: sub ? sub.is_enabled : false,
          };
        });
      }

      return {
        extension: ext,
        is_available: this.isExtensionAvailable(ext.code),
        sub_components_status: subComponentsStatus,
      };
    });
  }
}
