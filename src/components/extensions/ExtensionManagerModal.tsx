import React, { useState, useEffect } from 'react';
import {
  X,
  Puzzle,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Map,
  Search,
  Zap,
  Info,
  Power,
  ShieldCheck,
} from 'lucide-react';
import { TechnicalExtension } from '../../types/index.js';
import { api } from '../../services/api.js';

interface ExtensionManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExtensionToggled?: () => void;
}

export const ExtensionManagerModal: React.FC<ExtensionManagerModalProps> = ({
  isOpen,
  onClose,
  onExtensionToggled,
}) => {
  const [extensions, setExtensions] = useState<TechnicalExtension[]>([]);
  const [diagnostics, setDiagnostics] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [togglingCode, setTogglingCode] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [extList, diagList] = await Promise.all([
        api.extensions.list(),
        api.extensions.getDiagnostics(),
      ]);
      setExtensions(extList);
      setDiagnostics(diagList);
    } catch (err) {
      console.error('Failed to load extensions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) loadData();
  }, [isOpen]);

  const handleToggle = async (code: string, currentStatus: boolean) => {
    setTogglingCode(code);
    try {
      await api.extensions.toggle(code, !currentStatus);
      await loadData();
      if (onExtensionToggled) onExtensionToggled();
    } catch (err) {
      console.error('Failed to toggle extension:', err);
    } finally {
      setTogglingCode(null);
    }
  };

  if (!isOpen) return null;

  const compositeMaps = extensions.find((e) => e.code === 'maps');
  const atomicExtensions = extensions.filter((e) => e.type === 'atomic');

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-150">
      <div className="w-full max-w-3xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-200 flex items-start justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 shadow-2xs">
              <Puzzle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                Extension System Manager
                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-blue-50 text-blue-700 border border-blue-200">
                  Phase 2 Architecture
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Decoupled optional infrastructure capabilities. Core operates seamlessly without optional extensions.
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

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* Architectural Axiom Banner */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-3 text-xs text-slate-700 shadow-2xs">
            <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold text-slate-900">Key Architectural Rule (Strict Decoupling):</span>
              <p className="text-slate-500 leading-relaxed">
                Extensions <strong>never know which modules consume them</strong>. Domain modules (e.g. <code className="text-blue-700 bg-blue-50 px-1 py-0.5 rounded border border-blue-200">places</code>) declare <code className="text-blue-700 bg-blue-50 px-1 py-0.5 rounded border border-blue-200">requires: maps</code>. If disabled, domain modules gracefully fallback while Core remains 100% resilient.
              </p>
            </div>
          </div>

          {/* Composite Maps Bundle Card */}
          {compositeMaps && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 shadow-2xs">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-600 shrink-0">
                    <Map className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-sm text-slate-900">{compositeMaps.name}</h3>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-50 text-amber-700 border border-amber-200 font-semibold">
                        composite bundle
                      </span>
                      <span className="text-xs font-mono text-slate-500">v{compositeMaps.version}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{compositeMaps.description}</p>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={togglingCode === compositeMaps.code}
                  onClick={() => handleToggle(compositeMaps.code, compositeMaps.is_enabled)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 ${
                    compositeMaps.is_enabled
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Power className="w-3.5 h-3.5" />
                  {compositeMaps.is_enabled ? 'Active / Enabled' : 'Disabled'}
                </button>
              </div>

              {/* Sub-components Tree */}
              <div className="pl-4 border-l-2 border-slate-200 space-y-2 mt-3 pt-2">
                <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-medium">
                  Atomic Sub-Components Dependency Tree
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {atomicExtensions
                    .filter((e) => e.parent_extension === 'maps')
                    .map((sub) => (
                      <div
                        key={sub.id}
                        className="p-2.5 rounded-lg bg-white border border-slate-200 text-xs space-y-1 shadow-2xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-800">{sub.name}</span>
                          <span
                            className={`w-2 h-2 rounded-full ${
                              sub.is_enabled ? 'bg-emerald-500' : 'bg-slate-300'
                            }`}
                          />
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-2">{sub.description}</p>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* Standalone Atomic Extensions */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-blue-600" />
              Standalone Atomic Extensions
            </h3>

            <div className="space-y-2">
              {atomicExtensions
                .filter((e) => !e.parent_extension)
                .map((ext) => (
                  <div
                    key={ext.id}
                    className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start justify-between gap-4 shadow-2xs"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-purple-50 border border-purple-200 text-purple-600 shrink-0">
                        <Search className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-sm text-slate-900">{ext.name}</h4>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-purple-50 text-purple-700 border border-purple-200 font-semibold">
                            atomic
                          </span>
                          <span className="text-xs font-mono text-slate-500">v{ext.version}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">{ext.description}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={togglingCode === ext.code}
                      onClick={() => handleToggle(ext.code, ext.is_enabled)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 ${
                        ext.is_enabled
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100'
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <Power className="w-3.5 h-3.5" />
                      {ext.is_enabled ? 'Enabled' : 'Disabled'}
                    </button>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <span className="flex items-center gap-1.5 text-emerald-700 font-mono font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600" /> Extension Manager Active & Verifying
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
