import React, { useState } from 'react';
import {
  Download,
  Upload,
  Database,
  FileCode,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  X,
  FileJson,
  ShieldCheck,
  HardDrive,
} from 'lucide-react';
import { api } from '../../services/api.js';

interface DataBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBackupRestored: () => void;
}

export const DataBackupModal: React.FC<DataBackupModalProps> = ({
  isOpen,
  onClose,
  onBackupRestored,
}) => {
  const [importJson, setImportJson] = useState('');
  const [importStatus, setImportStatus] = useState<{ success?: boolean; message?: string } | null>(
    null
  );
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleDownloadJsonBackup = async () => {
    try {
      const res = await fetch('/api/core/backup/export');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lifehub_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert('Failed to export backup: ' + err.message);
    }
  };

  const handleDownloadYamlConfig = async () => {
    try {
      const yaml = await api.core.getConfigYaml();
      const blob = new Blob([yaml], { type: 'text/yaml' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'instance.yaml';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert('Failed to export YAML config: ' + err.message);
    }
  };

  const handleImportBackup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importJson.trim()) return;

    setLoading(true);
    setImportStatus(null);
    try {
      const parsed = JSON.parse(importJson);
      const res = await api.core.importBackup(parsed);
      setImportStatus({
        success: true,
        message: 'Snapshot restored successfully! Reloading system...',
      });
      setTimeout(() => {
        onBackupRestored();
        onClose();
      }, 1500);
    } catch (err: any) {
      setImportStatus({
        success: false,
        message: 'Restore failed: ' + (err.message || 'Invalid JSON backup format'),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setImportJson(content);
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">Database Backup & Portability</h3>
              <p className="text-[11px] text-slate-500">
                Export complete instance data or restore an existing snapshot bundle.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Quick Export Cards */}
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase font-mono tracking-wider mb-2.5">
              Export Snapshots
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
                    <FileJson className="w-4 h-4 text-emerald-600" /> Full Database JSON
                  </div>
                  <p className="text-[11px] text-slate-500">
                    All entities, relationships, meta properties, tags, and audit logs.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadJsonBackup}
                  className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xs transition-colors"
                >
                  <Download className="w-3.5 h-3.5" /> Download JSON Backup
                </button>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
                    <FileCode className="w-4 h-4 text-blue-600" /> Instance YAML Config
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Portable configuration file defining active modules and extension bundles.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadYamlConfig}
                  className="w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xs transition-colors"
                >
                  <Download className="w-3.5 h-3.5" /> Download instance.yaml
                </button>
              </div>
            </div>
          </div>

          {/* Restore Section */}
          <div className="border-t border-slate-200 pt-4 space-y-3">
            <div className="text-xs font-semibold text-slate-400 uppercase font-mono tracking-wider">
              Restore Snapshot from File / JSON
            </div>

            {importStatus && (
              <div
                className={`p-3 rounded-xl border text-xs font-medium flex items-center gap-2 ${
                  importStatus.success
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    : 'bg-rose-50 border-rose-200 text-rose-700'
                }`}
              >
                {importStatus.success ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                )}
                <span>{importStatus.message}</span>
              </div>
            )}

            <form onSubmit={handleImportBackup} className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <label className="text-xs text-slate-600 font-medium">Upload File</label>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
                />
              </div>

              <textarea
                rows={5}
                placeholder="Or paste full JSON backup contents here..."
                value={importJson}
                onChange={(e) => setImportJson(e.target.value)}
                className="w-full p-3 font-mono text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-emerald-600 focus:bg-white resize-y"
              />

              <div className="flex items-center justify-end gap-2">
                <button
                  type="submit"
                  disabled={loading || !importJson.trim()}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  Restore & Apply Snapshot
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Zero cloud vendor lock-in • 100% self-contained</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300 font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
