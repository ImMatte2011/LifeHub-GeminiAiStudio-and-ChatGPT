import React from 'react';
import {
  Search,
  Puzzle,
  FileCode,
  Users,
  Server,
  History,
  Shield,
  Layers,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Menu,
  Palette,
  Database,
  Globe,
} from 'lucide-react';
import { User, InstanceConfig } from '../../types/index.js';
import { useLanguage } from '../../i18n/LanguageContext.js';

interface HeaderProps {
  currentUser: User | null;
  config: InstanceConfig | null;
  mapsExtensionActive: boolean;
  onOpenSearch: () => void;
  onOpenExtensions: () => void;
  onOpenConfig: () => void;
  onOpenAuth: () => void;
  onOpenSystemOps: () => void;
  onOpenAuditLog: () => void;
  onOpenTheme: () => void;
  onOpenBackup: () => void;
  onToggleMobileSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  config,
  mapsExtensionActive,
  onOpenSearch,
  onOpenExtensions,
  onOpenConfig,
  onOpenAuth,
  onOpenSystemOps,
  onOpenAuditLog,
  onOpenTheme,
  onOpenBackup,
  onToggleMobileSidebar,
}) => {
  const { language, toggleLanguage, setLanguage, t } = useLanguage();

  return (
    <header className="h-16 border-b border-slate-200 bg-white/95 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Brand & Instance Tag */}
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

      {/* Operational Controls & Status Bar */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Mobile Search button */}
        <button
          type="button"
          onClick={onOpenSearch}
          className="md:hidden p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          title={t.common.search}
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Language Quick Toggle */}
        <button
          type="button"
          onClick={toggleLanguage}
          className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-blue-300 bg-slate-50 hover:bg-blue-50/60 text-slate-700 hover:text-blue-700 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs"
          title={language === 'it' ? 'Cambia lingua in Inglese' : 'Switch language to Italian'}
        >
          <span className="text-sm select-none">{language === 'it' ? '🇮🇹' : '🇬🇧'}</span>
          <span className="font-mono text-[11px] uppercase tracking-wider">{language}</span>
        </button>

        {/* Extensions Status Pill */}
        <button
          type="button"
          onClick={onOpenExtensions}
          className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-all ${
            mapsExtensionActive
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
              : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
          }`}
          title={t.header.extensionsTooltip}
        >
          <Puzzle className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{t.common.extensions}</span>
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              mapsExtensionActive ? 'bg-emerald-500' : 'bg-amber-500'
            }`}
          />
        </button>

        {/* Theme / Palette Customizer */}
        <button
          type="button"
          onClick={onOpenTheme}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
          title={t.header.paletteTooltip}
        >
          <Palette className="w-4 h-4" />
        </button>

        {/* Database Backup & Export */}
        <button
          type="button"
          onClick={onOpenBackup}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
          title={t.header.backupTooltip}
        >
          <Database className="w-4 h-4" />
        </button>

        {/* Instance YAML Config & Settings */}
        <button
          type="button"
          onClick={onOpenConfig}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
          title={t.header.configTooltip}
        >
          <FileCode className="w-4 h-4" />
        </button>

        {/* Audit Log */}
        <button
          type="button"
          onClick={onOpenAuditLog}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
          title={t.header.auditTooltip}
        >
          <History className="w-4 h-4" />
        </button>

        {/* System Operations & Telemetry */}
        <button
          type="button"
          onClick={onOpenSystemOps}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
          title={t.header.telemetryTooltip}
        >
          <Server className="w-4 h-4" />
        </button>

        <div className="h-4 w-px bg-slate-200 mx-1" />

        {/* User Account / Multi-user profile */}
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

