import React, { useState, useEffect } from 'react';
import {
  X,
  Server,
  HardDrive,
  Cpu,
  Database,
  Download,
  Upload,
  BookOpen,
  Activity,
  CheckCircle2,
  AlertCircle,
  FileText,
  Shield,
  Layers,
} from 'lucide-react';
import { api } from '../../services/api.js';

interface SystemOpsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SystemOpsModal: React.FC<SystemOpsModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'metrics' | 'backup' | 'docs'>('metrics');
  const [metrics, setMetrics] = useState<any>(null);
  const [selectedDoc, setSelectedDoc] = useState<'architecture' | 'operations' | 'api'>('architecture');
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      api.core.getSystemMetrics().then(setMetrics).catch(console.error);
    }
  }, [isOpen]);

  const handleExportBackup = async () => {
    try {
      const res = await fetch(api.core.exportBackupUrl);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lifehub_backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportStatus(null);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const json = JSON.parse(evt.target?.result as string);
        await api.core.importBackup(json);
        setImportStatus('Backup restored successfully! Database re-indexed.');
      } catch (err: any) {
        setImportStatus(`Restore error: ${err.message}`);
      } finally {
        setImporting(false);
      }
    };
    reader.readAsText(file);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-150">
      <div className="w-full max-w-4xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-200 flex items-start justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 shadow-2xs">
              <Server className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                LifeHub Operations & Hardware Telemetry
                <span className="text-xs px-2 py-0.5 rounded font-mono bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                  Raspberry Pi 4 / Docker / Postgres
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Hardware resource telemetry, PostgreSQL 16 state, backup snapshots & architectural documentation.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-4 sm:px-6 bg-slate-50 border-b border-slate-200 flex gap-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('metrics')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'metrics'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Activity className="w-4 h-4" /> Hardware & Postgres State
          </button>
          <button
            onClick={() => setActiveTab('backup')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'backup'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Database className="w-4 h-4" /> Backup & Disaster Recovery
          </button>
          <button
            onClick={() => setActiveTab('docs')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'docs'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-4 h-4" /> Architecture Docs
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {activeTab === 'metrics' && metrics && (
            <div className="space-y-6">
              {/* Host Node Specs */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-blue-600" /> Host Node (Raspberry Pi 4)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1 shadow-2xs">
                    <span className="text-[11px] text-slate-500 font-mono">CPU Temperature & Load</span>
                    <div className="text-lg font-bold text-slate-900 flex items-center justify-between">
                      <span>{metrics.host.cpu_temp_celsius}°C</span>
                      <span className="text-xs font-mono text-emerald-600 font-bold">{metrics.host.cpu_load_pct}% load</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2">
                      <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${metrics.host.cpu_load_pct}%` }} />
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1 shadow-2xs">
                    <span className="text-[11px] text-slate-500 font-mono">Memory (8GB LPDDR4)</span>
                    <div className="text-lg font-bold text-slate-900 flex items-center justify-between">
                      <span>{metrics.host.memory_used_mb} MB</span>
                      <span className="text-xs font-mono text-slate-400">/ 8,192 MB</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2">
                      <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${(metrics.host.memory_used_mb / 8192) * 100}%` }} />
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1 shadow-2xs">
                    <span className="text-[11px] text-slate-500 font-mono">Storage (SATA III SSD)</span>
                    <div className="text-lg font-bold text-slate-900 flex items-center justify-between">
                      <span>{metrics.host.storage_used_gb} GB</span>
                      <span className="text-xs font-mono text-slate-400">/ {metrics.host.storage_total_gb} GB</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2">
                      <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: `${(metrics.host.storage_used_gb / metrics.host.storage_total_gb) * 100}%` }} />
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap items-center justify-between text-xs text-slate-600 font-mono">
                  <span>Kernel: {metrics.host.platform}</span>
                  <span>Uptime: {metrics.host.uptime}</span>
                  <span>Docker Containers: {metrics.host.docker_containers_running} active</span>
                </div>
              </div>

              {/* Database Telemetry */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-emerald-600" /> PostgreSQL 16.2 Schemas & Tables
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center shadow-2xs">
                    <div className="text-xl font-bold text-slate-900">{metrics.database.total_entities}</div>
                    <div className="text-[11px] text-slate-500 font-mono">core.entities</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center shadow-2xs">
                    <div className="text-xl font-bold text-blue-600">{metrics.database.persons_count}</div>
                    <div className="text-[11px] text-slate-500 font-mono">people.persons</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center shadow-2xs">
                    <div className="text-xl font-bold text-amber-600">{metrics.database.places_count}</div>
                    <div className="text-[11px] text-slate-500 font-mono">places.places</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center shadow-2xs">
                    <div className="text-xl font-bold text-emerald-600">{metrics.database.knowledge_items_count}</div>
                    <div className="text-[11px] text-slate-500 font-mono">knowledge.items</div>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs text-slate-600 font-mono">
                  <div>Engine: {metrics.database.engine}</div>
                  <div>Extensions: {metrics.database.extensions_installed.join(' • ')}</div>
                  <div>Audit Log Size: {metrics.database.audit_records_count} operations recorded</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'backup' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
                <div>
                  <h3 className="font-semibold text-sm text-slate-900">Automatic Database Snapshots</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Export a full JSON snapshot of all Core, Meta, Shared, and Domain entities. Can be safely restored onto any LifeHub instance.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleExportBackup}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-2 transition-colors shadow-2xs"
                >
                  <Download className="w-4 h-4" /> Download Complete DB Snapshot (.json)
                </button>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
                <div>
                  <h3 className="font-semibold text-sm text-slate-900">Disaster Recovery Restore</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Restore database state from an exported LifeHub snapshot file.
                  </p>
                </div>

                {importStatus && (
                  <div className="p-3 rounded-lg bg-white border border-emerald-300 text-xs text-emerald-700 font-mono">
                    {importStatus}
                  </div>
                )}

                <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold cursor-pointer transition-colors border border-slate-200 shadow-2xs">
                  <Upload className="w-4 h-4" />
                  <span>{importing ? 'Restoring snapshot...' : 'Select Snapshot File to Restore'}</span>
                  <input type="file" accept=".json" onChange={handleImportFile} className="hidden" />
                </label>
              </div>
            </div>
          )}

          {activeTab === 'docs' && (
            <div className="space-y-4">
              <div className="flex gap-2 border-b border-slate-200 pb-2 text-xs">
                <button
                  onClick={() => setSelectedDoc('architecture')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                    selectedDoc === 'architecture' ? 'bg-blue-600 text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  ARCHITECTURE.md
                </button>
                <button
                  onClick={() => setSelectedDoc('operations')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                    selectedDoc === 'operations' ? 'bg-blue-600 text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  OPERATIONS.md
                </button>
                <button
                  onClick={() => setSelectedDoc('api')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                    selectedDoc === 'api' ? 'bg-blue-600 text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  API_REFERENCE.md
                </button>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs text-slate-300 space-y-3 leading-relaxed max-h-[50vh] overflow-y-auto shadow-inner">
                {selectedDoc === 'architecture' && (
                  <div>
                    <h4 className="text-emerald-400 font-bold mb-2"># LifeHub Architectural Layers & Boundaries</h4>
                    <p className="text-slate-400 mb-2">
                      1. <strong>CORE</strong>: Uncompromising baseline infrastructure (Auth, sessions, users, roles, permissions, universal entity registry `core.entities`, instance config, audit logs). Core NEVER imports or depends on domain modules or optional extensions.
                    </p>
                    <p className="text-slate-400 mb-2">
                      2. <strong>META LAYER</strong>: Dynamic schema definition engine (`meta.entity_types`, `meta.property_definitions`). Allows defining books, ammo, software, recipes, and custom dynamic models without running manual PostgreSQL DDL statements.
                    </p>
                    <p className="text-slate-400 mb-2">
                      3. <strong>SHARED SERVICES</strong>: Universal cross-cutting tables (`shared.tags`, `shared.links`, `shared.files`) linking any entity registered in `core.entities`.
                    </p>
                    <p className="text-slate-400 mb-2">
                      4. <strong>EXTENSIONS</strong>: Optional technical components (`maps`, `postgis`, `leaflet`, `osm`, `pg_trgm`) managed by ExtensionManager. Extensions have zero awareness of consuming modules.
                    </p>
                    <p className="text-slate-400">
                      5. <strong>DOMAIN MODULES</strong>: Dedicated functional units (`people`, `places`, `events`, `knowledge`, `buildings`).
                    </p>
                  </div>
                )}

                {selectedDoc === 'operations' && (
                  <div>
                    <h4 className="text-emerald-400 font-bold mb-2"># LifeHub Raspberry Pi 4 Self-Host Guide</h4>
                    <p className="text-slate-400 mb-2">
                      - Hardware Target: Raspberry Pi 4 Model B (8GB RAM, 64-bit ARMv8).
                    </p>
                    <p className="text-slate-400 mb-2">
                      - Storage: SATA III SSD connected via USB 3.0 with UASP driver enabled.
                    </p>
                    <p className="text-slate-400 mb-2">
                      - Docker Compose stack: PostgreSQL 16 with PostGIS 3.4 & pg_trgm + FastAPI/Express backend + React/Vite PWA frontend.
                    </p>
                    <p className="text-slate-400">
                      - Automated Backup: Nightly cron dump written to RAID volume with 30-day retention.
                    </p>
                  </div>
                )}

                {selectedDoc === 'api' && (
                  <div>
                    <h4 className="text-emerald-400 font-bold mb-2"># LifeHub REST API Specification</h4>
                    <p className="text-slate-400 mb-1">- GET /api/core/auth/me</p>
                    <p className="text-slate-400 mb-1">- GET /api/core/modules/active</p>
                    <p className="text-slate-400 mb-1">- GET /api/search?q=...&module=...&tag=...</p>
                    <p className="text-slate-400 mb-1">- GET /api/places/query/radius?lat=...&lng=...&radius_km=...</p>
                    <p className="text-slate-400 mb-1">- GET /api/knowledge?entity_type_id=...</p>
                    <p className="text-slate-400">- GET /api/extensions/diagnostics</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
