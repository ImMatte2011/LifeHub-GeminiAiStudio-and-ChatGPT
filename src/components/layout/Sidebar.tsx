import React from 'react';
import {
  LayoutDashboard,
  Users,
  MapPin,
  Calendar,
  BookOpen,
  Building2,
  Settings,
  Share2,
  Clock,
  Database,
  Download,
  Puzzle,
  Cpu,
  Shield,
  ChevronRight,
} from 'lucide-react';
import { ModuleInfo } from '../../types/index.js';
import { useLanguage } from '../../i18n/LanguageContext.js';
import { SettingsTabId } from '../config/UnifiedSettingsModal.js';

interface SidebarProps {
  activeModuleId: string;
  onSelectModule: (id: string) => void;
  modules: ModuleInfo[];
  entityCounts: Record<string, number>;
  mapsExtensionActive: boolean;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onOpenConfig: () => void;
  onOpenSettingsTab?: (tab: SettingsTabId) => void;
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
  onOpenSettingsTab,
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
        return <Users className="w-4 h-4 text-blue-400" />;
      case 'places':
        return <MapPin className="w-4 h-4 text-amber-400" />;
      case 'events':
        return <Calendar className="w-4 h-4 text-purple-400" />;
      case 'knowledge':
        return <BookOpen className="w-4 h-4 text-emerald-400" />;
      case 'buildings':
        return <Building2 className="w-4 h-4 text-rose-400" />;
      case 'schemas':
        return <Database className="w-4 h-4 text-teal-400" />;
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

  const domainModuleList = modules
    .filter((m) => m.is_enabled)
    .map((m) => ({
      id: m.id,
      name: getTranslatedName(m.id, m.name),
    }));

  const crossViewList = [
    { id: 'graph', name: t.sidebar.entityGraph },
    { id: 'timeline', name: t.sidebar.chronology },
    { id: 'schemas', name: t.sidebar.dbAndSchemas },
  ];

  const handleOpenSettings = (tab: SettingsTabId) => {
    if (onOpenSettingsTab) {
      onOpenSettingsTab(tab);
    } else {
      onOpenConfig();
    }
    onCloseMobile();
  };

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
          {/* 1. Home / Overview Button */}
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => {
                onSelectModule('dashboard');
                onCloseMobile();
              }}
              className={`w-full group flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeModuleId === 'dashboard'
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-900/40'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={activeModuleId === 'dashboard' ? 'text-white' : 'text-blue-400'}>
                  <LayoutDashboard className="w-4 h-4" />
                </span>
                <span>{t.sidebar.overview}</span>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900/60 text-slate-400 border border-slate-800">
                PWA
              </span>
            </button>
          </div>

          {/* 2. Group: Moduli Personali */}
          <div className="space-y-1.5">
            <div className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono flex items-center justify-between">
              <span>{t.sidebar.domainModules}</span>
              <span className="text-[10px] text-slate-500 font-normal">
                {domainModuleList.length} {t.sidebar.activeCount}
              </span>
            </div>

            <div className="space-y-0.5">
              {domainModuleList.map((item) => {
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
                    className={`w-full group flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
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
          </div>

          {/* 3. Group: Viste Trasversali & Rete Dati */}
          <div className="space-y-1.5">
            <div className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">
              {t.sidebar.crossViews}
            </div>

            <div className="space-y-0.5">
              {crossViewList.map((item) => {
                const isActive = activeModuleId === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onSelectModule(item.id);
                      onCloseMobile();
                    }}
                    className={`w-full group flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-sm shadow-blue-900/40'
                        : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}>
                        {getModuleIcon(item.id)}
                      </span>
                      <span className="truncate">{item.name}</span>
                    </div>
                    <ChevronRight className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-600 group-hover:text-slate-400'}`} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Group: Impostazioni & Sistema */}
          <div className="space-y-1.5">
            <div className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">
              {t.sidebar.systemSettings}
            </div>

            <div className="space-y-0.5">
              <button
                type="button"
                onClick={() => handleOpenSettings('general')}
                className="w-full group flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:bg-slate-800/80 hover:text-slate-100 transition-all text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Settings className="w-4 h-4 text-slate-400 group-hover:text-blue-400 transition-colors" />
                  <span className="truncate">{t.settingsModal.tabGeneral}</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleOpenSettings('backup')}
                className="w-full group flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:bg-slate-800/80 hover:text-slate-100 transition-all text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Download className="w-4 h-4 text-slate-400 group-hover:text-emerald-400 transition-colors" />
                  <span className="truncate">{t.settingsModal.tabBackup}</span>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-900 text-emerald-400 border border-slate-800">
                  JSON/SQL
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenSettings('extensions')}
                className="w-full group flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:bg-slate-800/80 hover:text-slate-100 transition-all text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Puzzle className="w-4 h-4 text-slate-400 group-hover:text-indigo-400 transition-colors" />
                  <span className="truncate">{t.settingsModal.tabExtensions}</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleOpenSettings('system')}
                className="w-full group flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:bg-slate-800/80 hover:text-slate-100 transition-all text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Cpu className="w-4 h-4 text-slate-400 group-hover:text-amber-400 transition-colors" />
                  <span className="truncate">{t.settingsModal.tabSystem}</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleOpenSettings('audit')}
                className="w-full group flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:bg-slate-800/80 hover:text-slate-100 transition-all text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Shield className="w-4 h-4 text-slate-400 group-hover:text-purple-400 transition-colors" />
                  <span className="truncate">{t.settingsModal.tabAudit}</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-slate-800/80 space-y-2">
          <button
            type="button"
            onClick={() => handleOpenSettings('general')}
            className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold flex items-center justify-center gap-2 border border-slate-800 transition-colors"
          >
            <Settings className="w-3.5 h-3.5 text-blue-400" />
            <span>{t.sidebar.configureInstance}</span>
          </button>
        </div>
      </aside>
    </>
  );
};
