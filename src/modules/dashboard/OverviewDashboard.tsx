import React from 'react';
import {
  Users,
  MapPin,
  Calendar,
  BookOpen,
  Building2,
  Search,
  ChevronRight,
  Layers,
  Sparkles,
} from 'lucide-react';
import { ModuleInfo, InstanceConfig } from '../../types/index.js';
import { useLanguage } from '../../i18n/LanguageContext.js';

interface OverviewDashboardProps {
  config: InstanceConfig | null;
  modules: ModuleInfo[];
  entityCounts: Record<string, number>;
  mapsExtensionActive: boolean;
  onNavigate: (module: string) => void;
  onOpenQuickCreate?: (type: string) => void;
  onOpenExtensions?: () => void;
  onOpenConfig?: () => void;
  onOpenSystemOps?: () => void;
  onOpenAuditLog?: () => void;
  onOpenSearch?: () => void;
  recentAuditLogs?: any[];
  systemMetrics?: any;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  config,
  modules,
  entityCounts,
  mapsExtensionActive,
  onNavigate,
  onOpenSearch,
}) => {
  const { t } = useLanguage();

  const totalIndexedEntities =
    (entityCounts.people || 0) +
    (entityCounts.places || 0) +
    (entityCounts.events || 0) +
    (entityCounts.knowledge || 0) +
    (entityCounts.buildings || 0);

  const isBuildingsEnabled = modules.some((m) => m.id === 'buildings' && m.is_enabled);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Welcome & Quick Launch Header */}
      <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-800 relative overflow-hidden shadow-xl text-white">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                ● ONLINE
              </span>
              <span className="text-xs font-mono text-slate-400">
                {config?.instance?.name || 'LifeHub Home Base'}
              </span>
              <span className="text-slate-600 hidden sm:inline">•</span>
              <span className="text-xs font-mono text-slate-400 hidden sm:inline">
                Raspberry Pi 4 • SATA SSD
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {t.dashboardHub.welcome}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
              {t.dashboardHub.quickAccessSubtitle}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {onOpenSearch && (
              <button
                type="button"
                onClick={onOpenSearch}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2.5 border border-slate-700 transition-all shadow-md group"
                title={t.dashboardHub.searchPrompt}
              >
                <Search className="w-4 h-4 text-blue-400 group-hover:text-blue-300" />
                <span>{t.dashboardHub.searchPrompt}</span>
                <kbd className="px-2 py-0.5 rounded bg-slate-900/80 border border-slate-700 font-mono text-[10px] text-slate-400">
                  ⌘K
                </kbd>
              </button>
            )}

            <div className="px-4 py-2.5 rounded-xl bg-blue-600/30 border border-blue-500/40 text-blue-200 text-xs font-semibold flex items-center gap-2 shadow-xs">
              <Layers className="w-4 h-4 text-blue-300" />
              <span>
                {totalIndexedEntities} {t.common.records}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Primary Domain Modules Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            {t.dashboardHub.categoryDomains}
          </h2>
          <span className="text-[11px] font-mono text-slate-400">
            {modules.filter((m) => m.is_enabled).length} {t.common.active}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
          {/* People & Contacts */}
          <button
            type="button"
            onClick={() => onNavigate('people')}
            className="group relative p-6 rounded-2xl bg-white border border-slate-200/90 hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/5 transition-all text-left flex flex-col justify-between min-h-[170px] focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          >
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Users className="w-6 h-6" />
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-slate-100 text-slate-700 group-hover:bg-blue-50 group-hover:text-blue-700 transition-colors">
                {entityCounts.people || 0}
              </span>
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                  {t.dashboardHub.peopleTitle}
                </h3>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
              </div>
              <p className="text-xs text-slate-500 line-clamp-2 mt-1.5 leading-relaxed">
                {t.dashboardHub.peopleDesc}
              </p>
            </div>
          </button>

          {/* Places & Maps */}
          <button
            type="button"
            onClick={() => onNavigate('places')}
            className="group relative p-6 rounded-2xl bg-white border border-slate-200/90 hover:border-amber-500 hover:shadow-xl hover:shadow-amber-500/5 transition-all text-left flex flex-col justify-between min-h-[170px] focus:outline-hidden focus:ring-2 focus:ring-amber-500"
          >
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors">
                <MapPin className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-1.5">
                {mapsExtensionActive ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    PostGIS
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                    Fallback
                  </span>
                )}
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-slate-100 text-slate-700 group-hover:bg-amber-50 group-hover:text-amber-700 transition-colors">
                  {entityCounts.places || 0}
                </span>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 group-hover:text-amber-600 transition-colors">
                  {t.dashboardHub.placesTitle}
                </h3>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-1 transition-all" />
              </div>
              <p className="text-xs text-slate-500 line-clamp-2 mt-1.5 leading-relaxed">
                {t.dashboardHub.placesDesc}
              </p>
            </div>
          </button>

          {/* Events & Calendar */}
          <button
            type="button"
            onClick={() => onNavigate('events')}
            className="group relative p-6 rounded-2xl bg-white border border-slate-200/90 hover:border-purple-500 hover:shadow-xl hover:shadow-purple-500/5 transition-all text-left flex flex-col justify-between min-h-[170px] focus:outline-hidden focus:ring-2 focus:ring-purple-500"
          >
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors">
                <Calendar className="w-6 h-6" />
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-slate-100 text-slate-700 group-hover:bg-purple-50 group-hover:text-purple-700 transition-colors">
                {entityCounts.events || 0}
              </span>
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 group-hover:text-purple-600 transition-colors">
                  {t.dashboardHub.eventsTitle}
                </h3>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
              </div>
              <p className="text-xs text-slate-500 line-clamp-2 mt-1.5 leading-relaxed">
                {t.dashboardHub.eventsDesc}
              </p>
            </div>
          </button>

          {/* Knowledge & Catalogs */}
          <button
            type="button"
            onClick={() => onNavigate('knowledge')}
            className="group relative p-6 rounded-2xl bg-white border border-slate-200/90 hover:border-emerald-500 hover:shadow-xl hover:shadow-emerald-500/5 transition-all text-left flex flex-col justify-between min-h-[170px] focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          >
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <BookOpen className="w-6 h-6" />
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-slate-100 text-slate-700 group-hover:bg-emerald-50 group-hover:text-emerald-700 transition-colors">
                {entityCounts.knowledge || 0}
              </span>
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                  {t.dashboardHub.knowledgeTitle}
                </h3>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
              </div>
              <p className="text-xs text-slate-500 line-clamp-2 mt-1.5 leading-relaxed">
                {t.dashboardHub.knowledgeDesc}
              </p>
            </div>
          </button>

          {/* Buildings & Real Estate Assets (if enabled) */}
          {isBuildingsEnabled && (
            <button
              type="button"
              onClick={() => onNavigate('buildings')}
              className="group relative p-6 rounded-2xl bg-white border border-slate-200/90 hover:border-rose-500 hover:shadow-xl hover:shadow-rose-500/5 transition-all text-left flex flex-col justify-between min-h-[170px] focus:outline-hidden focus:ring-2 focus:ring-rose-500"
            >
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center group-hover:bg-rose-600 group-hover:text-white transition-colors">
                  <Building2 className="w-6 h-6" />
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-slate-100 text-slate-700 group-hover:bg-rose-50 group-hover:text-rose-700 transition-colors">
                  {entityCounts.buildings || 0}
                </span>
              </div>
              <div className="mt-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-rose-600 transition-colors">
                    {t.dashboardHub.buildingsTitle}
                  </h3>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-rose-600 group-hover:translate-x-1 transition-all" />
                </div>
                <p className="text-xs text-slate-500 line-clamp-2 mt-1.5 leading-relaxed">
                  {t.dashboardHub.buildingsDesc}
                </p>
              </div>
            </button>
          )}
        </div>
      </section>
    </div>
  );
};
