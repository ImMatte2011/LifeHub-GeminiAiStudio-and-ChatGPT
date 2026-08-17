import React, { useState, useEffect } from 'react';
import {
  X,
  FileCode,
  Save,
  CheckCircle2,
  AlertCircle,
  Sliders,
  Sparkles,
  RefreshCw,
  Layers,
  Server,
  Users,
  MapPin,
  Calendar,
  BookOpen,
  Building2,
  UserCheck,
  Shield,
  Copy,
  Check,
  ToggleLeft,
  ToggleRight,
  Info,
  Languages,
  Globe,
} from 'lucide-react';
import * as yaml from 'js-yaml';
import { InstanceConfig } from '../../types/index.js';
import { api } from '../../services/api.js';
import { useLanguage } from '../../i18n/LanguageContext.js';
import { Language } from '../../i18n/translations.js';

interface InstanceConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigSaved: () => void;
}

export const InstanceConfigModal: React.FC<InstanceConfigModalProps> = ({
  isOpen,
  onClose,
  onConfigSaved,
}) => {
  const { language, setLanguage, t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'gui' | 'yaml'>('gui');
  const [yamlContent, setYamlContent] = useState('');
  const [configObj, setConfigObj] = useState<InstanceConfig>({
    instance: {
      name: 'LifeHub',
      description: 'Unified Personal Information Platform',
      host_env: 'Raspberry Pi 4 (8GB RAM / SATA III SSD)',
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
  const [presets, setPresets] = useState<Record<string, { name: string; yaml: string }>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setStatusMsg(null);
    try {
      const [yamlStr, currentConfig, presetsList] = await Promise.all([
        api.core.getConfigYaml(),
        api.core.getConfig(),
        api.core.getPresets(),
      ]);
      setYamlContent(yamlStr);
      if (currentConfig) {
        setConfigObj(currentConfig);
        if (currentConfig.settings?.language) {
          setLanguage(currentConfig.settings.language);
        }
      }
      setPresets(presetsList);
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

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

  // Sync state when switching tabs
  const handleTabSwitch = (newTab: 'gui' | 'yaml') => {
    if (newTab === 'yaml') {
      // Sync GUI state into YAML
      try {
        const generated = yaml.dump(configObj, { indent: 2 });
        setYamlContent(generated);
      } catch {
        // keep existing yamlContent
      }
    } else if (newTab === 'gui') {
      // Parse YAML into GUI state
      try {
        const parsed = yaml.load(yamlContent) as InstanceConfig;
        if (parsed && typeof parsed === 'object') {
          setConfigObj((prev) => ({
            ...prev,
            ...parsed,
            instance: { ...prev.instance, ...(parsed.instance || {}) },
            modules: { ...prev.modules, ...(parsed.modules || {}) },
            extensions: { ...prev.extensions, ...(parsed.extensions || {}) },
            settings: { ...prev.settings, ...(parsed.settings || {}) },
          }));
        }
      } catch (err: any) {
        setStatusMsg({
          type: 'error',
          text: `YAML format error: ${err.message}. Switch back to YAML to correct.`,
        });
      }
    }
    setActiveTab(newTab);
  };

  const handleSave = async () => {
    setSaving(true);
    setStatusMsg(null);
    try {
      if (activeTab === 'yaml') {
        await api.core.updateConfigYaml(yamlContent);
      } else {
        // Generate synced YAML and update
        const serialized = yaml.dump(configObj, { indent: 2 });
        await api.core.updateConfigYaml(serialized);
        setYamlContent(serialized);
      }
      setStatusMsg({ type: 'success', text: 'Instance configuration applied & saved successfully!' });
      onConfigSaved();
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message });
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
        }
      } catch {
        // ignore
      }
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
      name: 'People & Relationships',
      icon: <UserCheck className="w-4 h-4 text-blue-600" />,
      desc: 'Contacts, multi-channel details, family/friend links & interaction notes',
      reqExt: [],
    },
    {
      key: 'places',
      name: 'Places & Geo Locations',
      icon: <MapPin className="w-4 h-4 text-amber-600" />,
      desc: 'Spatial database, GPS coordinates, visits journal & proximity queries',
      reqExt: ['maps'],
    },
    {
      key: 'events',
      name: 'Events & Chronology',
      icon: <Calendar className="w-4 h-4 text-purple-600" />,
      desc: 'Schedules, attendee management, linked venues & calendar sync',
      reqExt: [],
    },
    {
      key: 'knowledge',
      name: 'Knowledge & Dynamic Meta',
      icon: <BookOpen className="w-4 h-4 text-emerald-600" />,
      desc: 'Custom schema catalogs (books, recipes, software, ammo, gear)',
      reqExt: ['pg_trgm'],
    },
    {
      key: 'buildings',
      name: 'Facilities & Infrastructure',
      icon: <Building2 className="w-4 h-4 text-rose-600" />,
      desc: 'Multi-floor architectural spaces, offices, labs & venue managers',
      reqExt: ['maps'],
    },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-150">
      <div className="w-full max-w-4xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-start justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 shadow-2xs">
              <FileCode className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">{t.configModal.title}</h2>
                <span className="text-xs px-2 py-0.5 rounded font-mono bg-slate-100 text-slate-700 border border-slate-200 font-semibold">
                  {t.configModal.yamlFile}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {t.configModal.subtitle}
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

        {/* View Mode Toggle & Presets Bar */}
        <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Tab Selector */}
          <div className="flex items-center bg-slate-200/80 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => handleTabSwitch('gui')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeTab === 'gui'
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              {t.configModal.visualTab}
            </button>
            <button
              type="button"
              onClick={() => handleTabSwitch('yaml')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeTab === 'yaml'
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              {t.configModal.yamlTab}
            </button>
          </div>

          {/* Presets */}
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

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
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

          {activeTab === 'gui' ? (
            <div className="space-y-6">
              {/* Language Selection Card */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-slate-50 border border-blue-200/80 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-900">
                    <Globe className="w-4 h-4 text-blue-600" />
                    {t.configModal.languagePreference}
                  </div>
                  <span className="text-[11px] font-medium text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-full border border-blue-200">
                    {language === 'it' ? '🇮🇹 Italiano Attivo' : '🇬🇧 English Active'}
                  </span>
                </div>
                <p className="text-xs text-slate-600">
                  {t.configModal.languageDesc}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* Italian Option */}
                  <div
                    onClick={() => handleLanguageChange('it')}
                    className={`p-3.5 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                      language === 'it'
                        ? 'bg-white border-blue-600 ring-2 ring-blue-500/20 shadow-xs'
                        : 'bg-white/60 border-slate-200 hover:border-slate-300 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-2xl select-none">🇮🇹</div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          Italiano
                          {language === 'it' && (
                            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">
                              Attivo
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500">Lingua italiana completa</div>
                      </div>
                    </div>
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      language === 'it' ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300'
                    }`}>
                      {language === 'it' && <Check className="w-2.5 h-2.5" />}
                    </div>
                  </div>

                  {/* English Option */}
                  <div
                    onClick={() => handleLanguageChange('en')}
                    className={`p-3.5 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                      language === 'en'
                        ? 'bg-white border-blue-600 ring-2 ring-blue-500/20 shadow-xs'
                        : 'bg-white/60 border-slate-200 hover:border-slate-300 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-2xl select-none">🇬🇧</div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          English
                          {language === 'en' && (
                            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">
                              Active
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500">English system interface</div>
                      </div>
                    </div>
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      language === 'en' ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300'
                    }`}>
                      {language === 'en' && <Check className="w-2.5 h-2.5" />}
                    </div>
                  </div>
                </div>
              </div>

              {/* Instance Identity */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 shadow-2xs">
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {moduleDefinitions.map((mod) => {
                    const isEnabled = Boolean(configObj.modules?.[mod.key]);
                    return (
                      <div
                        key={mod.key}
                        onClick={() => toggleModule(mod.key)}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                          isEnabled
                            ? 'bg-blue-50/40 border-blue-200 shadow-2xs hover:border-blue-300'
                            : 'bg-slate-50/60 border-slate-200 hover:border-slate-300 opacity-75'
                        }`}
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="p-2 rounded-lg bg-white border border-slate-200 shadow-2xs shrink-0 mt-0.5">
                            {mod.icon}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-sm text-slate-900">{mod.name}</span>
                              <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                                {mod.key}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-1 leading-relaxed">{mod.desc}</p>
                            {mod.reqExt.length > 0 && (
                              <div className="flex items-center gap-1.5 mt-2">
                                <span className="text-[10px] text-slate-400 font-medium">Requires:</span>
                                {mod.reqExt.map((ext) => (
                                  <span
                                    key={ext}
                                    className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200 font-semibold"
                                  >
                                    {ext}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleModule(mod.key);
                          }}
                          className={`p-1 rounded-lg transition-colors shrink-0 ${
                            isEnabled ? 'text-blue-600' : 'text-slate-400'
                          }`}
                        >
                          {isEnabled ? (
                            <ToggleRight className="w-6 h-6" />
                          ) : (
                            <ToggleLeft className="w-6 h-6" />
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Technical Extensions */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    {t.configModal.techExtensions}
                  </div>
                  <span className="text-[11px] text-slate-400">{t.configModal.decoupledInfra}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    onClick={() => toggleExtension('maps')}
                    className={`p-3 rounded-lg bg-white border cursor-pointer flex items-center justify-between transition-all ${
                      configObj.extensions?.maps
                        ? 'border-emerald-300 shadow-2xs'
                        : 'border-slate-200 opacity-70'
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-xs text-slate-900 flex items-center gap-1.5">
                        <span>Maps & GIS Bundle</span>
                        <span className="text-[10px] font-mono text-slate-500">(Leaflet / OSM / PostGIS)</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Interactive tiles and spatial geo-distance querying.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExtension('maps');
                      }}
                      className={configObj.extensions?.maps ? 'text-emerald-600' : 'text-slate-400'}
                    >
                      {configObj.extensions?.maps ? (
                        <ToggleRight className="w-6 h-6" />
                      ) : (
                        <ToggleLeft className="w-6 h-6" />
                      )}
                    </button>
                  </div>

                  <div
                    onClick={() => toggleExtension('pg_trgm')}
                    className={`p-3 rounded-lg bg-white border cursor-pointer flex items-center justify-between transition-all ${
                      configObj.extensions?.pg_trgm
                        ? 'border-emerald-300 shadow-2xs'
                        : 'border-slate-200 opacity-70'
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-xs text-slate-900 flex items-center gap-1.5">
                        <span>PostgreSQL pg_trgm</span>
                        <span className="text-[10px] font-mono text-slate-500">(Trigram Index)</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Fuzzy typo-tolerant search across all entity fields.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExtension('pg_trgm');
                      }}
                      className={configObj.extensions?.pg_trgm ? 'text-emerald-600' : 'text-slate-400'}
                    >
                      {configObj.extensions?.pg_trgm ? (
                        <ToggleRight className="w-6 h-6" />
                      ) : (
                        <ToggleLeft className="w-6 h-6" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* System & Access Settings */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 shadow-2xs">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
                  <Users className="w-4 h-4 text-purple-600" />
                  {t.configModal.systemGovernance}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 bg-white border border-slate-200 rounded-lg flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-xs text-slate-900">{t.configModal.multiUserMode}</div>
                      <div className="text-[11px] text-slate-500">{t.configModal.multiUserDesc}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setConfigObj((prev) => ({
                          ...prev,
                          settings: {
                            ...prev.settings,
                            multi_user_enabled: !prev.settings?.multi_user_enabled,
                          },
                        }))
                      }
                      className={configObj.settings?.multi_user_enabled ? 'text-blue-600' : 'text-slate-400'}
                    >
                      {configObj.settings?.multi_user_enabled ? (
                        <ToggleRight className="w-6 h-6" />
                      ) : (
                        <ToggleLeft className="w-6 h-6" />
                      )}
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      {t.configModal.defaultRole}
                    </label>
                    <select
                      value={configObj.settings?.default_role || 'member'}
                      onChange={(e) =>
                        setConfigObj((prev) => ({
                          ...prev,
                          settings: { ...prev.settings, default_role: e.target.value },
                        }))
                      }
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-blue-600"
                    >
                      <option value="member">{t.configModal.memberRole}</option>
                      <option value="editor">{t.configModal.editorRole}</option>
                      <option value="admin">{t.configModal.adminRole}</option>
                    </select>
                  </div>

                  <div className="p-3 bg-white border border-slate-200 rounded-lg flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-xs text-slate-900">{t.configModal.openRegistration}</div>
                      <div className="text-[11px] text-slate-500">{t.configModal.openRegDesc}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setConfigObj((prev) => ({
                          ...prev,
                          settings: {
                            ...prev.settings,
                            allow_registration: !prev.settings?.allow_registration,
                          },
                        }))
                      }
                      className={configObj.settings?.allow_registration ? 'text-blue-600' : 'text-slate-400'}
                    >
                      {configObj.settings?.allow_registration ? (
                        <ToggleRight className="w-6 h-6" />
                      ) : (
                        <ToggleLeft className="w-6 h-6" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <label className="font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <FileCode className="w-4 h-4 text-blue-600" />
                  {t.configModal.yamlSource} (`instance.yaml`)
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyYaml}
                    className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium flex items-center gap-1 transition-colors text-[11px]"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    {copied ? t.configModal.copied : t.configModal.copyYaml}
                  </button>
                  <span className="font-mono text-slate-400 text-[11px]">Strict YAML 1.2</span>
                </div>
              </div>

              <textarea
                value={yamlContent}
                onChange={(e) => setYamlContent(e.target.value)}
                rows={16}
                spellCheck={false}
                className="w-full p-4 rounded-xl bg-slate-900 font-mono text-xs text-blue-200 border border-slate-800 focus:border-blue-500 focus:outline-none leading-relaxed resize-none shadow-inner"
              />

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-2 text-xs text-slate-600">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  {language === 'it'
                    ? 'Qualsiasi modifica apportata qui sovrascrive direttamente la configurazione dell\'istanza. Passa all\'Interfaccia Visuale per ispezionare le modifiche.'
                    : 'Any edits made here directly override the instance specification. Switch to the Visual Interface at any time to inspect changes interactively.'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={loadData}
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
              {t.common.cancel}
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium flex items-center gap-1.5 shadow-2xs disabled:opacity-50 transition-all"
            >
              <Save className="w-4 h-4" />
              {saving ? t.configModal.saving : t.configModal.saveChanges}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

