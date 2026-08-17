import React from 'react';
import {
  Users,
  MapPin,
  Calendar,
  BookOpen,
  Building2,
  Plus,
  Server,
  Puzzle,
  FileCode,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Layers,
  Cpu,
  HardDrive,
  Activity,
  History,
} from 'lucide-react';
import { ModuleInfo, InstanceConfig, AuditLogItem } from '../../types/index.js';

interface OverviewDashboardProps {
  config: InstanceConfig | null;
  modules: ModuleInfo[];
  entityCounts: Record<string, number>;
  mapsExtensionActive: boolean;
  onNavigate: (module: string) => void;
  onOpenQuickCreate: (type: string) => void;
  onOpenExtensions: () => void;
  onOpenConfig: () => void;
  onOpenSystemOps: () => void;
  onOpenAuditLog: () => void;
  recentAuditLogs: AuditLogItem[];
  systemMetrics: any;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  config,
  modules,
  entityCounts,
  mapsExtensionActive,
  onNavigate,
  onOpenQuickCreate,
  onOpenExtensions,
  onOpenConfig,
  onOpenSystemOps,
  onOpenAuditLog,
  recentAuditLogs,
  systemMetrics,
}) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Welcome & Host Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-800 relative overflow-hidden shadow-lg text-white">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                ● ONLINE
              </span>
              <span className="text-xs font-mono text-slate-400">
                Instance: {config?.instance?.name || 'LifeHub Home Base'}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              LifeHub Modular Engine
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Self-hosted personal information platform running on Raspberry Pi 4 (8GB RAM / SATA III SSD). Strict decoupling: Core, Meta Layer, Shared Services, Extension System, and Domain Modules.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onOpenSystemOps}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-2 border border-slate-700 transition-colors shadow-xs"
            >
              <Cpu className="w-3.5 h-3.5 text-emerald-400" />
              <span>{systemMetrics?.host?.cpu_temp_celsius || '41.2'}°C</span>
              <span className="text-slate-500">•</span>
              <span>{systemMetrics?.host?.memory_used_mb || '1280'} MB RAM</span>
            </button>

            <button
              type="button"
              onClick={onOpenConfig}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-md shadow-blue-900/30"
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Config YAML</span>
            </button>
          </div>
        </div>
      </div>

      {/* Entity Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div
          onClick={() => onNavigate('people')}
          className="p-4 rounded-xl bg-white border border-slate-200 hover:border-blue-300 hover:shadow-md cursor-pointer transition-all shadow-2xs group"
        >
          <div className="flex items-center justify-between text-slate-400 group-hover:text-blue-600">
            <Users className="w-4 h-4" />
            <span className="text-[10px] font-mono uppercase text-slate-400">People</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {entityCounts.people || 0}
          </div>
          <span className="text-[11px] text-slate-500 font-sans">contacts & relations</span>
        </div>

        <div
          onClick={() => onNavigate('places')}
          className="p-4 rounded-xl bg-white border border-slate-200 hover:border-amber-300 hover:shadow-md cursor-pointer transition-all shadow-2xs group"
        >
          <div className="flex items-center justify-between text-slate-400 group-hover:text-amber-600">
            <MapPin className="w-4 h-4" />
            <span className="text-[10px] font-mono uppercase text-slate-400">Places</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {entityCounts.places || 0}
          </div>
          <span className="text-[11px] text-slate-500 font-sans">
            {mapsExtensionActive ? 'PostGIS + Leaflet' : 'Coords fallback'}
          </span>
        </div>

        <div
          onClick={() => onNavigate('events')}
          className="p-4 rounded-xl bg-white border border-slate-200 hover:border-purple-300 hover:shadow-md cursor-pointer transition-all shadow-2xs group"
        >
          <div className="flex items-center justify-between text-slate-400 group-hover:text-purple-600">
            <Calendar className="w-4 h-4" />
            <span className="text-[10px] font-mono uppercase text-slate-400">Events</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {entityCounts.events || 0}
          </div>
          <span className="text-[11px] text-slate-500 font-sans">timeline & meetings</span>
        </div>

        <div
          onClick={() => onNavigate('knowledge')}
          className="p-4 rounded-xl bg-white border border-slate-200 hover:border-emerald-300 hover:shadow-md cursor-pointer transition-all shadow-2xs group"
        >
          <div className="flex items-center justify-between text-slate-400 group-hover:text-emerald-600">
            <BookOpen className="w-4 h-4" />
            <span className="text-[10px] font-mono uppercase text-slate-400">Knowledge</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {entityCounts.knowledge || 0}
          </div>
          <span className="text-[11px] text-slate-500 font-sans">Meta Layer + JSONB</span>
        </div>

        <div
          onClick={() => onNavigate('buildings')}
          className="p-4 rounded-xl bg-white border border-slate-200 hover:border-rose-300 hover:shadow-md cursor-pointer transition-all shadow-2xs group"
        >
          <div className="flex items-center justify-between text-slate-400 group-hover:text-rose-600">
            <Building2 className="w-4 h-4" />
            <span className="text-[10px] font-mono uppercase text-slate-400">Phase 12</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {entityCounts.buildings || 0}
          </div>
          <span className="text-[11px] text-slate-500 font-sans">Buildings Demo</span>
        </div>

        <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 flex flex-col justify-between">
          <div className="flex items-center justify-between text-blue-700">
            <Layers className="w-4 h-4" />
            <span className="text-[10px] font-mono uppercase font-semibold text-blue-600">Registry</span>
          </div>
          <div className="text-2xl font-bold text-blue-900 mt-2">
            {(entityCounts.people || 0) +
              (entityCounts.places || 0) +
              (entityCounts.events || 0) +
              (entityCounts.knowledge || 0) +
              (entityCounts.buildings || 0)}
          </div>
          <span className="text-[11px] text-blue-700 font-mono">core.entities total</span>
        </div>
      </div>

      {/* Quick Action Creation Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" /> Quick Add Entity
        </span>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onOpenQuickCreate('person')}
            className="px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors border border-slate-200"
          >
            <Plus className="w-3.5 h-3.5 text-blue-600" /> Person
          </button>
          <button
            type="button"
            onClick={() => onOpenQuickCreate('place')}
            className="px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors border border-slate-200"
          >
            <Plus className="w-3.5 h-3.5 text-amber-600" /> Place
          </button>
          <button
            type="button"
            onClick={() => onOpenQuickCreate('event')}
            className="px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors border border-slate-200"
          >
            <Plus className="w-3.5 h-3.5 text-purple-600" /> Event
          </button>
          <button
            type="button"
            onClick={() => onOpenQuickCreate('knowledge')}
            className="px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors border border-slate-200"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-600" /> Knowledge Item
          </button>
          <button
            type="button"
            onClick={() => onOpenQuickCreate('building')}
            className="px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors border border-slate-200"
          >
            <Plus className="w-3.5 h-3.5 text-rose-600" /> Building
          </button>
        </div>
      </div>

      {/* Two Column Layout: Active Architectural Modules & Recent Audit Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Active Modules & Extensions Health */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-blue-600" /> Active Modules ({modules.length})
            </h2>
            <button
              type="button"
              onClick={onOpenConfig}
              className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium"
            >
              instance.yaml <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2.5">
            {modules.map((mod) => {
              const isPlaces = mod.id === 'places';
              const missingReq = isPlaces && !mapsExtensionActive;

              return (
                <div
                  key={mod.id}
                  className="p-3.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 transition-colors flex items-center justify-between gap-3 text-xs shadow-2xs"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        mod.is_enabled ? 'bg-emerald-500' : 'bg-slate-400'
                      }`}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-800">{mod.name}</span>
                        <span className="text-[10px] font-mono text-slate-400">v{mod.version}</span>
                        {mod.id === 'buildings' && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-50 text-rose-700 border border-rose-200 font-mono">
                            Phase 12 Demo
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">{mod.description}</p>
                      {missingReq && (
                        <span className="text-[10px] text-amber-600 font-mono mt-1 block">
                          ⚠ maps extension disabled: running in fallback mode
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onNavigate(mod.id)}
                    className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors shrink-0 border border-slate-200"
                  >
                    Open View
                  </button>
                </div>
              );
            })}
          </div>

          {/* Extension Decoupling Card */}
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Puzzle className="w-4 h-4 text-blue-600" />
                <span className="font-semibold text-slate-800">Extension System Status</span>
              </div>
              <button
                type="button"
                onClick={onOpenExtensions}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Manage Extensions
              </button>
            </div>
            <div className="flex items-center gap-4 text-slate-500 text-[11px]">
              <span className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${mapsExtensionActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                Maps (PostGIS + Leaflet + OSM)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                pg_trgm Fuzzy Index
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Recent Audit Log Activity */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <History className="w-4 h-4 text-purple-600" /> Recent Audit Activity
            </h2>
            <button
              type="button"
              onClick={onOpenAuditLog}
              className="text-xs text-purple-600 hover:text-purple-700 flex items-center gap-1 font-medium"
            >
              View All Logs <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2.5">
            {recentAuditLogs.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">No audit logs recorded yet.</div>
            ) : (
              recentAuditLogs.slice(0, 6).map((log) => (
                <div
                  key={log.id}
                  className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs flex items-center justify-between gap-3 font-mono"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700 shrink-0">
                      {log.action}
                    </span>
                    <span className="text-slate-800 font-sans truncate">{log.details}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 shrink-0">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
