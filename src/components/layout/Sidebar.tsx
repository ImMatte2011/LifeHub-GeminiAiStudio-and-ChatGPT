import React from 'react';
import {
  LayoutDashboard,
  Users,
  MapPin,
  Calendar,
  BookOpen,
  Building2,
  Tag as TagIcon,
  Puzzle,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Power,
  Settings,
  Share2,
  Clock,
  Database,
} from 'lucide-react';
import { ModuleInfo } from '../../types/index.js';
import { useLanguage } from '../../i18n/LanguageContext.js';

interface SidebarProps {
  activeModuleId: string;
  onSelectModule: (id: string) => void;
  modules: ModuleInfo[];
  entityCounts: Record<string, number>;
  mapsExtensionActive: boolean;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onOpenConfig: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeModuleId,
  onSelectModule,
  modules,
  entityCounts,
  mapsExtensionActive,
  mobileOpen,
  onCloseMobile,
  onOpenConfig,
}) => {
  const { t } = useLanguage();

  const getModuleIcon = (id: string) => {
    switch (id) {
      case 'dashboard':
        return <LayoutDashboard className="w-4 h-4" />;
      case 'graph':
        return <Share2 className="w-4 h-4 text-sky-400" />;
      case 'timeline':
        return <Clock className="w-4 h-4 text-purple-400" />;
      case 'people':
        return <Users className="w-4 h-4" />;
      case 'places':
        return <MapPin className="w-4 h-4" />;
      case 'events':
        return <Calendar className="w-4 h-4" />;
      case 'knowledge':
        return <BookOpen className="w-4 h-4" />;
      case 'buildings':
        return <Building2 className="w-4 h-4" />;
      case 'schemas':
        return <Database className="w-4 h-4 text-emerald-400" />;
      default:
        return <BookOpen className="w-4 h-4" />;
    }
  };

  const getTranslatedName = (id: string, defaultName: string) => {
    const navMap: Record<string, string> = {
      dashboard: t.sidebar.overview,
      schemas: t.sidebar.dbAndSchemas,
      graph: t.sidebar.entityGraph,
      timeline: t.sidebar.chronology,
      people: t.sidebar.people,
      places: t.sidebar.places,
      events: t.sidebar.events,
      knowledge: t.sidebar.knowledge,
      buildings: t.sidebar.buildings,
    };
    return navMap[id] || defaultName;
  };

  const navItems = [
    { id: 'dashboard', name: t.sidebar.overview, icon: 'dashboard', description: 'Instance Telemetry & Hub' },
    ...modules.filter((m) => m.is_enabled).map((m) => ({
      ...m,
      name: getTranslatedName(m.id, m.name),
    })),
    { id: 'schemas', name: t.sidebar.dbAndSchemas, icon: 'schemas', description: 'Multi-Database & Interactive Schema Viewer' },
    { id: 'graph', name: t.sidebar.entityGraph, icon: 'graph', description: 'Universal Relationship Network' },
    { id: 'timeline', name: t.sidebar.chronology, icon: 'timeline', description: 'Unified Activity Feed' },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden"
        />
      )}

      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-40 w-64 bg-[#0f172a] text-slate-300 border-r border-slate-800 flex flex-col justify-between transition-transform duration-200 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Navigation List */}
        <div className="p-4 space-y-6 flex-1 overflow-y-auto">
          {/* Active Modules Section */}
          <div className="space-y-1">
            <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400 font-mono">
              {t.sidebar.domainModules} ({modules.filter((m) => m.is_enabled).length})
            </div>

            {navItems.map((item) => {
              const isActive = activeModuleId === item.id;
              const count = entityCounts[item.id];
              const isPlaces = item.id === 'places';
              const requiresMaps = isPlaces && !mapsExtensionActive;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onSelectModule(item.id);
                    onCloseMobile();
                  }}
                  className={`w-full group flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-900/40'
                      : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}>
                      {getModuleIcon(item.id)}
                    </span>
                    <div className="text-left truncate">
                      <span className="block truncate">{item.name}</span>
                      {requiresMaps && (
                        <span className="text-[10px] text-amber-400 font-normal block truncate">
                          {t.sidebar.fallbackMaps}
                        </span>
                      )}
                    </div>
                  </div>

                  {count !== undefined && count > 0 && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold ${
                        isActive
                          ? 'bg-blue-700 text-white'
                          : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700 group-hover:text-slate-200'
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Core Architectural Rules Box */}
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2 text-xs">
            <div className="text-[11px] font-mono text-slate-300 font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              {t.sidebar.decoupledCore}
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              {t.sidebar.decoupledDesc}
            </p>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800 bg-[#0b1120] space-y-2.5">
          <button
            type="button"
            onClick={onOpenConfig}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 hover:text-white transition-colors"
          >
            <div className="flex items-center gap-2">
              <Settings className="w-3.5 h-3.5 text-slate-400" />
              <span>{t.sidebar.configureInstance}</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
          </button>

          <div className="text-center">
            <span className="text-[10px] font-mono text-slate-500 block">
              LifeHub Core v1.0.0 • SQLite/Postgres Ready
            </span>
            <span className="text-[9px] font-mono text-slate-600 block mt-0.5">
              RPi 4 (8GB RAM) • SATA III SSD
            </span>
          </div>
        </div>
      </aside>
    </>
  );
};
