import React from 'react';
import {
  Search,
  Settings,
  Layers,
  Menu,
  CheckCircle2,
  Globe,
  Database,
} from 'lucide-react';
import { User, InstanceConfig } from '../../types/index.js';
import { useLanguage } from '../../i18n/LanguageContext.js';

interface HeaderProps {
  currentUser: User | null;
  config: InstanceConfig | null;
  mapsExtensionActive: boolean;
  onOpenSearch: () => void;
  onOpenSettings: () => void;
  onOpenAuth: () => void;
  onToggleMobileSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  config,
  mapsExtensionActive,
  onOpenSearch,
  onOpenSettings,
  onOpenAuth,
  onToggleMobileSidebar,
}) => {
  const { language, t } = useLanguage();
  const dbEngine = config?.database?.engine || 'cloud_sql';

  return (
    <header className="h-16 border-b border-slate-200 bg-white/95 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Brand & Instance Identity Tag */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleMobileSidebar}
          className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center font-bold text-white shadow-sm shadow-blue-500/20">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold tracking-tight text-slate-900">LifeHub</h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                {config?.instance?.name || 'Self-Hosted'}
              </span>
              <span className="hidden xl:inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                <Database className="w-3 h-3 text-blue-600" />
                {dbEngine === 'cloud_sql' ? 'Cloud SQL' : 'Local SQLite'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              {t.header.modularEngine}
            </p>
          </div>
        </div>
      </div>

      {/* Global Spotlight Search Trigger */}
      <div className="flex-1 max-w-md mx-4 hidden md:block">
        <button
          type="button"
          onClick={onOpenSearch}
          className="w-full flex items-center justify-between px-3.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 text-xs text-slate-500 hover:text-slate-800 transition-all shadow-2xs group"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-blue-600 group-hover:text-blue-700 transition-colors" />
            <span>{t.header.searchPlaceholder}</span>
          </div>
          <kbd className="px-1.5 py-0.5 rounded bg-slate-200/80 border border-slate-300 font-mono text-[10px] text-slate-600">
            {t.header.quickSearchShortcut}
          </kbd>
        </button>
      </div>

      {/* Consolidated Action Bar */}
      <div className="flex items-center gap-2">
        {/* Mobile Search trigger */}
        <button
          type="button"
          onClick={onOpenSearch}
          className="md:hidden p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          title={t.common.search}
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Central Unified Settings Hub Button (Gear Icon) */}
        <button
          type="button"
          onClick={onOpenSettings}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100/90 hover:bg-slate-200/80 text-slate-800 border border-slate-200 text-xs font-semibold transition-all shadow-2xs group"
          title={t.settingsModal.title}
        >
          <Settings className="w-4 h-4 text-slate-600 group-hover:text-blue-600 group-hover:rotate-45 transition-all duration-200" />
          <span className="hidden sm:inline">{t.common.settings}</span>
          <div className="flex items-center gap-1">
            <span className="text-[11px] select-none font-normal opacity-90">
              {language === 'it' ? '🇮🇹' : '🇬🇧'}
            </span>
            <span
              className={`w-2 h-2 rounded-full ${
                mapsExtensionActive ? 'bg-emerald-500' : 'bg-blue-500'
              }`}
            />
          </div>
        </button>

        <div className="h-4 w-px bg-slate-200 mx-0.5" />

        {/* User Account / Profile Trigger */}
        <button
          type="button"
          onClick={onOpenAuth}
          className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-colors text-left"
          title={t.header.profileTooltip}
        >
          <div className="w-7 h-7 rounded-full bg-blue-600 border border-blue-400 flex items-center justify-center font-bold text-white text-xs shadow-xs">
            {currentUser?.full_name?.charAt(0) || currentUser?.username?.charAt(0) || 'A'}
          </div>
          <div className="hidden xl:block">
            <div className="text-xs font-semibold text-slate-800 leading-tight">
              {currentUser?.full_name || currentUser?.username}
            </div>
            <div className="text-[10px] font-mono text-blue-600 uppercase font-semibold">
              {currentUser?.role_id}
            </div>
          </div>
        </button>
      </div>
    </header>
  );
};
