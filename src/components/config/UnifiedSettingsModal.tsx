import React, { useState, useEffect } from 'react';
import {
  X,
  Settings,
  Database,
  Globe,
  Palette,
  Layers,
  FileCode,
  Shield,
  Activity,
  CheckCircle2,
  AlertCircle,
  Server,
  Cloud,
  HardDrive,
  RefreshCw,
  Sparkles,
  Sliders,
  Copy,
  Check,
  ToggleLeft,
  ToggleRight,
  Info,
  Download,
  Upload,
  Cpu,
  UserCheck,
  MapPin,
  Calendar,
  BookOpen,
  Building2,
  ExternalLink,
} from 'lucide-react';
import * as yaml from 'js-yaml';
import { InstanceConfig, DatabaseInfo } from '../../types/index.js';
import { api } from '../../services/api.js';
import { useLanguage } from '../../i18n/LanguageContext.js';
import { Language } from '../../i18n/translations.js';

export type SettingsTabId =
  | 'general'
  | 'database'
  | 'backup'
  | 'language'
  | 'theme'
  | 'extensions'
  | 'audit'
  | 'system';

interface UnifiedSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: SettingsTabId;
  onConfigSaved?: () => void;
}

export const UnifiedSettingsModal: React.FC<UnifiedSettingsModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'general',
  onConfigSaved,
}) => {
  const { language, setLanguage, t } = useLanguage();
  const [activeTab, setActiveTab] = useState<SettingsTabId>(initialTab);

  // General & YAML state
  const [yamlMode, setYamlMode] = useState<'gui' | 'yaml'>('gui');
  const [yamlContent, setYamlContent] = useState('');
  const [configObj, setConfigObj] = useState<InstanceConfig>({
    instance: {
      name: 'LifeHub',
      description: 'Unified Personal Information Platform',
      host_env: 'Raspberry Pi 4 (8GB RAM / SATA III SSD)',
    },
    database: {
      engine: 'cloud_sql',
      active_instance: 'lifehub_main',
      local: {
        file_path: '/var/lib/lifehub/data.sqlite',
        auto_sync: true,
        backup_on_save: true,
        format: 'sqlite',
      },
      cloud_sql: {
        provider: 'google_cloud_sql',
        region: 'europe-west2',
        instance_id: 'ai-studio-80c1662d',
        db_name: 'lifehub_main',
        status: 'connected',
      },
    },
    modules: {
      people: true,
      places: true,
      events: true,
      knowledge: true,
      buildings: false,
    },
    extensions: {
      maps: true,
      pg_trgm: true,
    },
    settings: {
      multi_user_enabled: true,
      default_role: 'member',
      allow_registration: false,
      language: 'it',
    },
  });

  // Presets
  const [presets, setPresets] = useState<Record<string, { name: string; yaml: string }>>({});

  // Database Engine state
  const [dbList, setDbList] = useState<DatabaseInfo[]>([]);
  const [selectedEngine, setSelectedEngine] = useState<'cloud_sql' | 'local_sqlite' | 'local_file'>('cloud_sql');
  const [localFilePath, setLocalFilePath] = useState('/var/lib/lifehub/data.sqlite');
  const [autoSyncLocal, setAutoSyncLocal] = useState(true);
  const [activeDbId, setActiveDbId] = useState('lifehub_main');
  const [cloudSqlInfo, setCloudSqlInfo] = useState<any>(null);
  const [localStorageInfo, setLocalStorageInfo] = useState<any>(null);

  // Theme state
  const [activePalette, setActivePalette] = useState('blue');

  // Audit state
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditFilter, setAuditFilter] = useState('');

  // System Ops state
  const [systemMetrics, setSystemMetrics] = useState<any>(null);

  // Status & Feedback
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copied, setCopied] = useState(false);

  // Initialize initial tab whenever modal opens with a requested tab
  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // Load configuration and data
  const loadAllData = async () => {
    setLoading(true);
    try {
      const [yamlStr, currentConfig, presetsList, dbData, sysMetrics, auditData] = await Promise.all([
        api.core.getConfigYaml().catch(() => ''),
        api.core.getConfig().catch(() => null),
        api.core.getPresets().catch(() => ({})),
        api.databases.list().catch(() => null),
        api.core.getSystemMetrics().catch(() => null),
        api.core.getAuditLog({ limit: 40 }).catch(() => []),
      ]);

      if (yamlStr) setYamlContent(yamlStr);
      if (currentConfig) {
        setConfigObj(currentConfig);
        if (currentConfig.settings?.language) {
          setLanguage(currentConfig.settings.language);
        }
        if (currentConfig.database?.engine) {
          setSelectedEngine(currentConfig.database.engine);
        }
        if (currentConfig.database?.local?.file_path) {
          setLocalFilePath(currentConfig.database.local.file_path);
        }
        if (typeof currentConfig.database?.local?.auto_sync === 'boolean') {
          setAutoSyncLocal(currentConfig.database.local.auto_sync);
        }
      }
      setPresets(presetsList);

      if (dbData) {
        setDbList(dbData.databases || []);
        setActiveDbId(dbData.active_database_id || 'lifehub_main');
        if (dbData.engine) setSelectedEngine(dbData.engine as any);
        if (dbData.cloud_sql_info) setCloudSqlInfo(dbData.cloud_sql_info);
        if (dbData.local_storage_info) setLocalStorageInfo(dbData.local_storage_info);
      }

      if (sysMetrics) setSystemMetrics(sysMetrics);
      if (auditData) setAuditLogs(auditData);
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to load settings' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadAllData();
    }
  }, [isOpen]);

  // Language Change
  const handleLanguageChange = (newLang: Language) => {
    setLanguage(newLang);
    setConfigObj((prev) => {
      const updated = {
        ...prev,
        settings: {
          ...prev.settings,
          language: newLang,
        },
      };
      try {
        setYamlContent(yaml.dump(updated, { indent: 2 }));
      } catch {}
      return updated;
    });
  };

  // Switch Database Engine
  const handleSwitchEngine = async (engine: 'cloud_sql' | 'local_sqlite' | 'local_file') => {
    setSelectedEngine(engine);
    setSaving(true);
    try {
      const res = await api.databases.switchEngine({
        engine,
        file_path: localFilePath,
        auto_sync: autoSyncLocal,
        active_instance: activeDbId,
      });

      setConfigObj((prev) => ({
        ...prev,
        database: res.database_config,
      }));

      try {
        setYamlContent(yaml.dump({ ...configObj, database: res.database_config }, { indent: 2 }));
      } catch {}

      setStatusMsg({
        type: 'success',
        text: res.message || t.settingsModal.switchEngineSuccess,
      });
      if (onConfigSaved) onConfigSaved();
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to switch database engine' });
    } finally {
      setSaving(false);
    }
  };

  // Save full configuration
  const handleSaveConfig = async () => {
    setSaving(true);
    setStatusMsg(null);
    try {
      if (yamlMode === 'yaml') {
        await api.core.updateConfigYaml(yamlContent);
      } else {
        const payload: InstanceConfig = {
          ...configObj,
          database: {
            engine: selectedEngine,
            active_instance: activeDbId,
            local: {
              file_path: localFilePath,
              auto_sync: autoSyncLocal,
              backup_on_save: true,
              format: 'sqlite',
            },
            cloud_sql: {
              provider: 'google_cloud_sql',
              region: 'europe-west2',
              instance_id: 'ai-studio-80c1662d',
              db_name: activeDbId,
              status: 'connected',
            },
          },
        };
        const serialized = yaml.dump(payload, { indent: 2 });
        await api.core.updateConfigYaml(serialized);
        setYamlContent(serialized);
        setConfigObj(payload);
      }

      setStatusMsg({ type: 'success', text: t.configModal.configSavedSuccess });
      if (onConfigSaved) onConfigSaved();
      setTimeout(() => setStatusMsg(null), 3500);
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to save configuration' });
    } finally {
      setSaving(false);
    }
  };

  const handleApplyPreset = (key: string) => {
    const p = presets[key];
    if (p) {
      setYamlContent(p.yaml);
      try {
        const parsed = yaml.load(p.yaml) as InstanceConfig;
        if (parsed) {
          setConfigObj(parsed);
          if (parsed.database?.engine) setSelectedEngine(parsed.database.engine);
          if (parsed.settings?.language) setLanguage(parsed.settings.language);
        }
      } catch {}
      setStatusMsg({ type: 'success', text: `Loaded preset: ${p.name}` });
      setTimeout(() => setStatusMsg(null), 2500);
    }
  };

  const toggleModule = (modKey: string) => {
    setConfigObj((prev) => {
      const nextModules = { ...prev.modules, [modKey]: !prev.modules[modKey] };
      const updated = { ...prev, modules: nextModules };
      try {
        setYamlContent(yaml.dump(updated, { indent: 2 }));
      } catch {}
      return updated;
    });
  };

  const toggleExtension = (extKey: string) => {
    setConfigObj((prev) => {
      const nextExt = { ...prev.extensions, [extKey]: !prev.extensions[extKey] };
      const updated = { ...prev, extensions: nextExt };
      try {
        setYamlContent(yaml.dump(updated, { indent: 2 }));
      } catch {}
      return updated;
    });
  };

  const handleCopyYaml = () => {
    navigator.clipboard.writeText(yamlContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const moduleDefinitions = [
    {
      key: 'people',
      name: t.common.people,
      icon: <UserCheck className="w-4 h-4 text-blue-600" />,
      desc: 'Contacts, multi-channel details, family/friend links & interaction notes',
      reqExt: [],
    },
    {
      key: 'places',
      name: t.common.places,
      icon: <MapPin className="w-4 h-4 text-amber-600" />,
      desc: 'Spatial database, GPS coordinates, visits journal & proximity queries',
      reqExt: ['maps'],
    },
    {
      key: 'events',
      name: t.common.events,
      icon: <Calendar className="w-4 h-4 text-purple-600" />,
      desc: 'Schedules, attendee management, linked venues & calendar sync',
      reqExt: [],
    },
    {
      key: 'knowledge',
      name: t.common.knowledge,
      icon: <BookOpen className="w-4 h-4 text-emerald-600" />,
      desc: 'Custom schema catalogs (books, recipes, software, gear, ammo)',
      reqExt: ['pg_trgm'],
    },
    {
      key: 'buildings',
      name: t.common.buildings,
      icon: <Building2 className="w-4 h-4 text-rose-600" />,
      desc: 'Multi-floor architectural spaces, offices, labs & venue managers',
      reqExt: ['maps'],
    },
  ];

  const paletteOptions = [
    { id: 'blue', name: 'Ocean Blue (Default)', hex: '#2563eb', bg: 'bg-blue-600' },
    { id: 'emerald', name: 'Emerald Forest', hex: '#059669', bg: 'bg-emerald-600' },
    { id: 'indigo', name: 'Royal Indigo', hex: '#4f46e5', bg: 'bg-indigo-600' },
    { id: 'amber', name: 'Amber Gold', hex: '#d97706', bg: 'bg-amber-600' },
    { id: 'rose', name: 'Crimson Rose', hex: '#e11d48', bg: 'bg-rose-600' },
    { id: 'violet', name: 'Deep Violet', hex: '#7c3aed', bg: 'bg-violet-600' },
  ];

  const navItems = [
    { id: 'general', label: t.settingsModal.tabGeneral, icon: <FileCode className="w-4 h-4" /> },
    { id: 'database', label: t.settingsModal.tabDatabase, icon: <Database className="w-4 h-4" />, badge: selectedEngine === 'cloud_sql' ? 'Cloud SQL' : 'Local File' },
    { id: 'backup', label: t.settingsModal.tabBackup, icon: <Download className="w-4 h-4" /> },
    { id: 'language', label: t.settingsModal.tabLanguage, icon: <Globe className="w-4 h-4" />, badge: language.toUpperCase() },
    { id: 'theme', label: t.settingsModal.tabTheme, icon: <Palette className="w-4 h-4" /> },
    { id: 'extensions', label: t.settingsModal.tabExtensions, icon: <Layers className="w-4 h-4" /> },
    { id: 'audit', label: t.settingsModal.tabAudit, icon: <Shield className="w-4 h-4" /> },
    { id: 'system', label: t.settingsModal.tabSystem, icon: <Activity className="w-4 h-4" /> },
  ];

  // Backup & Portability handlers
  const [backupStatusMsg, setBackupStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const handleDownloadFullJson = async () => {
    try {
      setIsExporting(true);
      const res = await fetch('/api/core/backup/export');
      if (!res.ok) throw new Error('Backup export failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lifehub_full_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      setBackupStatusMsg({ type: 'success', text: 'Full JSON backup downloaded successfully!' });
      setTimeout(() => setBackupStatusMsg(null), 3000);
    } catch (err: any) {
      setBackupStatusMsg({ type: 'error', text: err.message || 'Export error' });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportModular = async (moduleName: string, format: 'json' | 'vcf' | 'geojson' | 'ics') => {
    try {
      setIsExporting(true);
      const res = await fetch(`/api/${moduleName}`);
      if (!res.ok) throw new Error(`Export ${moduleName} failed`);
      const data = await res.json();
      
      let fileContent = '';
      let mimeType = 'application/json';
      let extension = 'json';

      if (format === 'json') {
        fileContent = JSON.stringify(data, null, 2);
      } else if (format === 'vcf' && Array.isArray(data)) {
        mimeType = 'text/vcard';
        extension = 'vcf';
        fileContent = data.map((p: any) => `BEGIN:VCARD\nVERSION:3.0\nFN:${p.first_name || ''} ${p.last_name || ''}\nEMAIL:${p.email || ''}\nTEL:${p.phone || ''}\nNOTE:${p.notes || ''}\nEND:VCARD`).join('\n\n');
      } else if (format === 'geojson' && Array.isArray(data)) {
        extension = 'geojson';
        fileContent = JSON.stringify({
          type: 'FeatureCollection',
          features: data.map((pl: any) => ({
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [pl.longitude || 0, pl.latitude || 0]
            },
            properties: {
              name: pl.name,
              category: pl.category,
              address: pl.address_raw,
            }
          }))
        }, null, 2);
      } else if (format === 'ics' && Array.isArray(data)) {
        mimeType = 'text/calendar';
        extension = 'ics';
        fileContent = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//LifeHub//Calendar 1.0//EN\n` + data.map((ev: any) => `BEGIN:VEVENT\nSUMMARY:${ev.title || ''}\nDESCRIPTION:${ev.description || ''}\nDTSTART:${(ev.start_time || '').replace(/[-:]/g, '').split('.')[0]}Z\nEND:VEVENT`).join('\n') + `\nEND:VCALENDAR`;
      } else {
        fileContent = JSON.stringify(data, null, 2);
      }

      const blob = new Blob([fileContent], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lifehub_${moduleName}_${new Date().toISOString().split('T')[0]}.${extension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      setBackupStatusMsg({ type: 'success', text: `Exported ${moduleName} successfully!` });
      setTimeout(() => setBackupStatusMsg(null), 3000);
    } catch (err: any) {
      setBackupStatusMsg({ type: 'error', text: err.message || `Export error on ${moduleName}` });
    } finally {
      setIsExporting(false);
    }
  };

  const handleRestoreFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsRestoring(true);
      setBackupStatusMsg(null);
      const text = await file.text();
      const parsed = JSON.parse(text);
      await api.core.importBackup(parsed);
      setBackupStatusMsg({ type: 'success', text: t.backupPanel.restoreSuccess });
      if (onConfigSaved) onConfigSaved();
      setTimeout(() => setBackupStatusMsg(null), 4000);
    } catch (err: any) {
      setBackupStatusMsg({ type: 'error', text: err.message || t.backupPanel.restoreError });
    } finally {
      setIsRestoring(false);
      e.target.value = '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto animate-in fade-in duration-150">
      <div className="w-full max-w-5xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 shadow-2xs">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">{t.settingsModal.title}</h2>
                <span className="text-xs px-2 py-0.5 rounded font-mono bg-blue-100/70 text-blue-800 border border-blue-200 font-semibold">
                  v1.0.0-rc1
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {t.settingsModal.subtitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Layout: Sidebar Tabs + Content Area */}
        <div className="flex flex-col md:flex-row flex-1 min-h-0 overflow-hidden">
          {/* Navigation Sidebar */}
          <div className="w-full md:w-64 bg-slate-50/70 border-b md:border-b-0 md:border-r border-slate-200 p-2 sm:p-3 space-y-1 overflow-x-auto md:overflow-y-auto flex md:flex-col gap-1 shrink-0">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id as SettingsTabId)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap md:whitespace-normal shrink-0 md:w-full ${
                  activeTab === item.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={activeTab === item.id ? 'text-white' : 'text-slate-500'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-medium ml-2 ${
                      activeTab === item.id
                        ? 'bg-blue-700/80 text-blue-100'
                        : 'bg-slate-200/80 text-slate-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Tab Content Panel */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-6">
            {/* Status Message */}
            {statusMsg && (
              <div
                className={`p-3 rounded-xl flex items-center gap-2.5 text-xs font-medium ${
                  statusMsg.type === 'success'
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border border-rose-200 text-rose-800'
                }`}
              >
                {statusMsg.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{statusMsg.text}</span>
              </div>
            )}

            {/* TAB 1: GENERAL & YAML */}
            {activeTab === 'general' && (
              <div className="space-y-6">
                {/* Visual / YAML Mode Switcher & Presets */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center bg-slate-200/80 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setYamlMode('gui')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                        yamlMode === 'gui'
                          ? 'bg-white text-blue-700 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      {t.configModal.visualTab}
                    </button>
                    <button
                      type="button"
                      onClick={() => setYamlMode('yaml')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                        yamlMode === 'yaml'
                          ? 'bg-white text-blue-700 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <FileCode className="w-3.5 h-3.5" />
                      {t.configModal.yamlTab}
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
                    <span className="text-slate-500 flex items-center gap-1 font-medium mr-1 shrink-0">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" /> {t.configModal.presets}
                    </span>
                    {Object.entries(presets).map(([key, p]: [string, { name: string; yaml: string }]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => handleApplyPreset(key)}
                        className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-medium transition-colors shadow-2xs shrink-0"
                      >
                        {p.name.split('(')[0].trim()}
                      </button>
                    ))}
                  </div>
                </div>

                {yamlMode === 'gui' ? (
                  <div className="space-y-5">
                    {/* Instance Identity */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
                        <Server className="w-4 h-4 text-blue-600" />
                        {t.configModal.instanceIdentity}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">
                            {t.configModal.instanceName}
                          </label>
                          <input
                            type="text"
                            value={configObj.instance?.name || ''}
                            onChange={(e) =>
                              setConfigObj((prev) => ({
                                ...prev,
                                instance: { ...prev.instance, name: e.target.value },
                              }))
                            }
                            className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-blue-600"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">
                            {t.configModal.hostEnv}
                          </label>
                          <input
                            type="text"
                            value={configObj.instance?.host_env || ''}
                            onChange={(e) =>
                              setConfigObj((prev) => ({
                                ...prev,
                                instance: { ...prev.instance, host_env: e.target.value },
                              }))
                            }
                            className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-blue-600"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-medium text-slate-600 mb-1">
                            {t.configModal.instanceDesc}
                          </label>
                          <input
                            type="text"
                            value={configObj.instance?.description || ''}
                            onChange={(e) =>
                              setConfigObj((prev) => ({
                                ...prev,
                                instance: { ...prev.instance, description: e.target.value },
                              }))
                            }
                            className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-blue-600"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Domain Modules */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
                          <Layers className="w-4 h-4 text-blue-600" />
                          {t.configModal.domainModules}
                        </div>
                        <span className="text-[11px] text-slate-500 font-mono">
                          {Object.values(configObj.modules || {}).filter(Boolean).length} of {moduleDefinitions.length} {t.configModal.activeModulesCount}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {moduleDefinitions.map((mod) => {
                          const isEnabled = Boolean(configObj.modules?.[mod.key]);
                          return (
                            <div
                              key={mod.key}
                              onClick={() => toggleModule(mod.key)}
                              className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                                isEnabled
                                  ? 'bg-blue-50/40 border-blue-200 shadow-2xs'
                                  : 'bg-slate-50/60 border-slate-200 opacity-70'
                              }`}
                            >
                              <div className="flex items-start gap-2.5 min-w-0">
                                <div className="p-2 rounded-lg bg-white border border-slate-200 shadow-2xs shrink-0 mt-0.5">
                                  {mod.icon}
                                </div>
                                <div className="min-w-0">
                                  <div className="font-bold text-xs text-slate-900">{mod.name}</div>
                                  <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{mod.desc}</p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleModule(mod.key);
                                }}
                                className={isEnabled ? 'text-blue-600' : 'text-slate-400'}
                              >
                                {isEnabled ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono text-slate-500">instance.yaml</span>
                      <button
                        type="button"
                        onClick={handleCopyYaml}
                        className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium flex items-center gap-1 text-[11px]"
                      >
                        {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        {copied ? t.configModal.copied : t.configModal.copyYaml}
                      </button>
                    </div>
                    <textarea
                      value={yamlContent}
                      onChange={(e) => setYamlContent(e.target.value)}
                      rows={14}
                      className="w-full p-4 rounded-xl bg-slate-900 font-mono text-xs text-blue-200 border border-slate-800 focus:border-blue-500 focus:outline-none leading-relaxed resize-none shadow-inner"
                    />
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: DATABASE & STORAGE (Choice between Cloud SQL and Local SQLite file on PC/RPi) */}
            {activeTab === 'database' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{t.settingsModal.dbEngineTitle}</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {t.settingsModal.dbEngineDesc}
                  </p>
                </div>

                {/* Storage Engine Selector Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Cloud SQL Card */}
                  <div
                    onClick={() => handleSwitchEngine('cloud_sql')}
                    className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                      selectedEngine === 'cloud_sql'
                        ? 'bg-blue-50/50 border-blue-600 ring-2 ring-blue-500/20 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 rounded-lg bg-blue-100/70 text-blue-700">
                            <Cloud className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-900">{t.settingsModal.cloudSqlOption}</div>
                            <div className="text-[10px] text-blue-700 font-mono">europe-west2 • PostgreSQL</div>
                          </div>
                        </div>
                        {selectedEngine === 'cloud_sql' && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> {t.settingsModal.connected}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {t.settingsModal.cloudSqlDesc}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-slate-500">
                      <span>{t.settingsModal.cloudRegion}</span>
                      <span className="font-mono text-blue-600 font-semibold">Instance: ai-studio-80c1662d</span>
                    </div>
                  </div>

                  {/* Local DB File / PC / Raspberry Pi Card */}
                  <div
                    onClick={() => handleSwitchEngine('local_sqlite')}
                    className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                      selectedEngine === 'local_sqlite' || selectedEngine === 'local_file'
                        ? 'bg-amber-50/50 border-amber-600 ring-2 ring-amber-500/20 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 rounded-lg bg-amber-100/70 text-amber-700">
                            <HardDrive className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-900">{t.settingsModal.localDbOption}</div>
                            <div className="text-[10px] text-amber-700 font-mono">Local File / SQLite / RPi</div>
                          </div>
                        </div>
                        {(selectedEngine === 'local_sqlite' || selectedEngine === 'local_file') && (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> {t.settingsModal.ready}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {t.settingsModal.localDbDesc}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-slate-500">
                      <span>Zero Cloud Latency</span>
                      <span className="font-mono text-amber-600 font-semibold">Standalone File Storage</span>
                    </div>
                  </div>
                </div>

                {/* Local Storage File Configuration */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
                      <HardDrive className="w-4 h-4 text-amber-600" />
                      {t.settingsModal.localFilePath}
                    </div>
                    <span className="text-[11px] text-slate-500 font-mono">SQLite 3.x Engine</span>
                  </div>

                  <div className="space-y-2">
                    <input
                      type="text"
                      value={localFilePath}
                      onChange={(e) => setLocalFilePath(e.target.value)}
                      placeholder="/var/lib/lifehub/data.sqlite or ./data/lifehub.sqlite"
                      className="w-full px-3.5 py-2 text-xs font-mono bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-blue-600"
                    />
                    <p className="text-[11px] text-slate-500">
                      {t.settingsModal.localFilePathHelp}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                    <div>
                      <div className="text-xs font-semibold text-slate-900">{t.settingsModal.autoSyncLocal}</div>
                      <div className="text-[11px] text-slate-500">{t.settingsModal.autoSyncDesc}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAutoSyncLocal(!autoSyncLocal)}
                      className={autoSyncLocal ? 'text-blue-600' : 'text-slate-400'}
                    >
                      {autoSyncLocal ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
                    </button>
                  </div>
                </div>

                {/* Database Catalogs and Snapshots */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      {t.settingsModal.activeDbInstance}
                    </div>
                    <span className="text-xs font-mono text-slate-500">
                      {dbList.length} databases registered
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {dbList.map((d) => (
                      <div
                        key={d.id}
                        onClick={() => setActiveDbId(d.id)}
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${
                          activeDbId === d.id
                            ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                            : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="font-bold text-xs truncate">{d.name}</div>
                        <div className={`text-[10px] mt-0.5 ${activeDbId === d.id ? 'text-blue-100' : 'text-slate-500'}`}>
                          {d.total_tables} tables • {d.total_records} records
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB: BACKUP & DATA PORTABILITY */}
            {activeTab === 'backup' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{t.backupPanel.title}</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {t.backupPanel.subtitle}
                  </p>
                </div>

                {backupStatusMsg && (
                  <div
                    className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
                      backupStatusMsg.type === 'success'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-rose-50 text-rose-800 border-rose-200'
                    }`}
                  >
                    {backupStatusMsg.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <span>{backupStatusMsg.text}</span>
                  </div>
                )}

                {/* 1. Full Database Snapshot Card */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-blue-100/70 text-blue-700">
                        <HardDrive className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">{t.backupPanel.fullBackupTitle}</div>
                        <div className="text-[10px] text-slate-500 font-mono">SQLite Schema + JSONB Data + Relations</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleDownloadFullJson}
                      disabled={isExporting}
                      className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors disabled:opacity-50"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{t.backupPanel.downloadFullJson}</span>
                    </button>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {t.backupPanel.fullBackupDesc}
                  </p>
                </div>

                {/* 2. Modular Open Standards Export */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      {t.backupPanel.exportFormatModular}
                    </div>
                    <span className="text-[11px] font-mono text-slate-500">vCard • GeoJSON • iCal • JSON</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* People vCard */}
                    <div className="p-3 bg-white rounded-lg border border-slate-200 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <UserCheck className="w-4 h-4 text-blue-600 shrink-0" />
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-900 truncate">{t.backupPanel.exportPeopleVcf}</div>
                          <div className="text-[10px] text-slate-500">Apple Contacts & Google compatible</div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleExportModular('people', 'vcf')}
                        disabled={isExporting}
                        className="px-2.5 py-1.5 rounded bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 text-[11px] font-semibold flex items-center gap-1 border border-slate-200 transition-colors shrink-0"
                      >
                        <Download className="w-3 h-3" /> .VCF
                      </button>
                    </div>

                    {/* Places GeoJSON */}
                    <div className="p-3 bg-white rounded-lg border border-slate-200 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <MapPin className="w-4 h-4 text-amber-600 shrink-0" />
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-900 truncate">{t.backupPanel.exportPlacesGeoJson}</div>
                          <div className="text-[10px] text-slate-500">QGIS & OpenStreetMap compatible</div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleExportModular('places', 'geojson')}
                        disabled={isExporting}
                        className="px-2.5 py-1.5 rounded bg-slate-100 hover:bg-amber-50 hover:text-amber-700 text-slate-700 text-[11px] font-semibold flex items-center gap-1 border border-slate-200 transition-colors shrink-0"
                      >
                        <Download className="w-3 h-3" /> GeoJSON
                      </button>
                    </div>

                    {/* Events iCal */}
                    <div className="p-3 bg-white rounded-lg border border-slate-200 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Calendar className="w-4 h-4 text-purple-600 shrink-0" />
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-900 truncate">{t.backupPanel.exportEventsIcs}</div>
                          <div className="text-[10px] text-slate-500">Google Calendar & Outlook format</div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleExportModular('events', 'ics')}
                        disabled={isExporting}
                        className="px-2.5 py-1.5 rounded bg-slate-100 hover:bg-purple-50 hover:text-purple-700 text-slate-700 text-[11px] font-semibold flex items-center gap-1 border border-slate-200 transition-colors shrink-0"
                      >
                        <Download className="w-3 h-3" /> .ICS
                      </button>
                    </div>

                    {/* Knowledge JSON */}
                    <div className="p-3 bg-white rounded-lg border border-slate-200 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <BookOpen className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-900 truncate">{t.backupPanel.exportKnowledgeJson}</div>
                          <div className="text-[10px] text-slate-500">Custom metadata & catalogs</div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleExportModular('knowledge', 'json')}
                        disabled={isExporting}
                        className="px-2.5 py-1.5 rounded bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 text-[11px] font-semibold flex items-center gap-1 border border-slate-200 transition-colors shrink-0"
                      >
                        <Download className="w-3 h-3" /> JSON
                      </button>
                    </div>
                  </div>
                </div>

                {/* 3. Import & Restore Tool */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      {t.backupPanel.importRestoreTitle}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {t.backupPanel.importRestoreDesc}
                    </p>
                  </div>

                  <label className="border-2 border-dashed border-slate-300 hover:border-blue-400 bg-white rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors group">
                    <Upload className="w-8 h-8 text-slate-400 group-hover:text-blue-600 transition-colors mb-2" />
                    <span className="text-xs font-semibold text-slate-700 group-hover:text-blue-600">
                      {isRestoring ? 'Ripristino in corso...' : t.backupPanel.dragDropFile}
                    </span>
                    <span className="text-[10px] text-slate-400 mt-1 font-mono">
                      Formato supportato: .json (Backup LifeHub)
                    </span>
                    <input
                      type="file"
                      accept=".json,application/json"
                      onChange={handleRestoreFile}
                      disabled={isRestoring}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            )}

            {/* TAB 3: LANGUAGE & I18N */}
            {activeTab === 'language' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{t.configModal.languagePreference}</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {t.configModal.languageDesc}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Italian Card */}
                  <div
                    onClick={() => handleLanguageChange('it')}
                    className={`p-4 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                      language === 'it'
                        ? 'bg-blue-50/40 border-blue-600 ring-2 ring-blue-500/20 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-3xl select-none">🇮🇹</div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          Italiano (Italian)
                          {language === 'it' && (
                            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">
                              Attivo
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500">Lingua italiana nativa</div>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                      language === 'it' ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300'
                    }`}>
                      {language === 'it' && <Check className="w-3 h-3 text-white" />}
                    </div>
                  </div>

                  {/* English Card */}
                  <div
                    onClick={() => handleLanguageChange('en')}
                    className={`p-4 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                      language === 'en'
                        ? 'bg-blue-50/40 border-blue-600 ring-2 ring-blue-500/20 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-3xl select-none">🇬🇧</div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          English (Inglese)
                          {language === 'en' && (
                            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">
                              Active
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500">English system interface</div>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                      language === 'en' ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300'
                    }`}>
                      {language === 'en' && <Check className="w-3 h-3 text-white" />}
                    </div>
                  </div>
                </div>

                {/* User Data Translation & Temporary Cache System */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-blue-600" />
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        {language === 'it' ? 'Traduzione Dinamica Dati Utente' : 'User Data Dynamic Translation'}
                      </span>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                      {language === 'it' ? 'Zero Modifiche al DB' : 'Original Data Intact'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {language === 'it'
                      ? 'Traduce al volo descrizioni, note, titoli e biografie inserite dall\'utente nella lingua attiva. Utilizza file di cache temporanei su disco per non ritradurre i dati ogni volta. I record originali nel database NON vengono in alcun modo modificati o alterati.'
                      : 'Translates user-entered descriptions, notes, titles, and bios on the fly into the active language. Uses temporary disk cache files to avoid re-translating every time. Original database records are NEVER modified or altered.'}
                  </p>

                  <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <div className="font-semibold text-slate-900">
                          {language === 'it' ? 'File Cache Temporaneo' : 'Temporary Disk Cache File'}
                        </div>
                        <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                          ./data/cache/user_data_translations.json
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await api.translate.clearCache();
                            setStatusMsg({
                              type: 'success',
                              text: language === 'it' ? 'File di cache temporaneo azzerato!' : 'Temporary cache cleared!',
                            });
                            setTimeout(() => setStatusMsg(null), 2500);
                          } catch {}
                        }}
                        className="px-2.5 py-1 text-[11px] rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
                      >
                        {language === 'it' ? 'Azzera Cache' : 'Purge Cache'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: THEME & PALETTE */}
            {activeTab === 'theme' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{t.themeModal.title}</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {t.themeModal.subtitle}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {paletteOptions.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => setActivePalette(p.id)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                        activePalette === p.id
                          ? 'bg-white border-blue-600 ring-2 ring-blue-500/20 shadow-2xs'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full ${p.bg} shadow-2xs`} />
                        <span className="text-xs font-bold text-slate-900">{p.name}</span>
                      </div>
                      {activePalette === p.id && <Check className="w-4 h-4 text-blue-600" />}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 5: EXTENSIONS */}
            {activeTab === 'extensions' && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{t.extensionsModal.title}</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {t.extensionsModal.subtitle}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    onClick={() => toggleExtension('maps')}
                    className={`p-4 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                      configObj.extensions?.maps ? 'bg-emerald-50/40 border-emerald-300 shadow-2xs' : 'bg-slate-50 border-slate-200 opacity-70'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-xs text-slate-900">Maps & Leaflet GIS Bundle</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">Interactive spatial tiles, PostGIS & GPS tracking</div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExtension('maps');
                      }}
                      className={configObj.extensions?.maps ? 'text-emerald-600' : 'text-slate-400'}
                    >
                      {configObj.extensions?.maps ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
                    </button>
                  </div>

                  <div
                    onClick={() => toggleExtension('pg_trgm')}
                    className={`p-4 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                      configObj.extensions?.pg_trgm ? 'bg-emerald-50/40 border-emerald-300 shadow-2xs' : 'bg-slate-50 border-slate-200 opacity-70'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-xs text-slate-900">PostgreSQL pg_trgm Index</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">Typo-tolerant fuzzy trigram search</div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExtension('pg_trgm');
                      }}
                      className={configObj.extensions?.pg_trgm ? 'text-emerald-600' : 'text-slate-400'}
                    >
                      {configObj.extensions?.pg_trgm ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 6: AUDIT LOG */}
            {activeTab === 'audit' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{t.common.auditLog}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Traceable audit trails for all configuration and data modifications.</p>
                  </div>
                  <input
                    type="text"
                    placeholder="Filter audit..."
                    value={auditFilter}
                    onChange={(e) => setAuditFilter(e.target.value)}
                    className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-blue-600 w-44"
                  />
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                  {auditLogs
                    .filter((l) => !auditFilter || l.details?.toLowerCase().includes(auditFilter.toLowerCase()) || l.action?.toLowerCase().includes(auditFilter.toLowerCase()))
                    .map((log) => (
                      <div key={log.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-100 text-blue-800">
                              {log.action}
                            </span>
                            <span className="font-semibold text-slate-900">{log.details}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-1 font-mono">{log.timestamp}</div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* TAB 7: SYSTEM OPS & TELEMETRY */}
            {activeTab === 'system' && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{t.common.systemOps}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Real-time hardware telemetry and connection status.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Host Environment</div>
                    <div className="text-xs font-bold text-slate-900 mt-1">Raspberry Pi 4 • 8GB</div>
                    <div className="text-[10px] text-emerald-700 mt-0.5 font-medium">Status: Optimal (42°C)</div>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Active Storage</div>
                    <div className="text-xs font-bold text-slate-900 mt-1">
                      {selectedEngine === 'cloud_sql' ? 'Google Cloud SQL' : 'Local SQLite File'}
                    </div>
                    <div className="text-[10px] text-blue-700 mt-0.5 font-mono">Drizzle ORM Engine</div>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Memory / RAM</div>
                    <div className="text-xs font-bold text-slate-900 mt-1">42 MB Node.js Process</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Extremely lightweight</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={loadAllData}
            disabled={loading}
            className="text-slate-600 hover:text-slate-900 font-medium flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            {t.common.refresh}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 font-medium"
            >
              {t.common.close}
            </button>
            <button
              type="button"
              onClick={handleSaveConfig}
              disabled={saving}
              className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium flex items-center gap-1.5 shadow-2xs disabled:opacity-50 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              {saving ? t.configModal.saving : t.configModal.saveChanges}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
