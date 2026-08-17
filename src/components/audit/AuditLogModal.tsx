import React, { useState, useEffect } from 'react';
import {
  X,
  History,
  Shield,
  Filter,
  RefreshCw,
  Clock,
  User,
} from 'lucide-react';
import { AuditLogItem } from '../../types/index.js';
import { api } from '../../services/api.js';

interface AuditLogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuditLogModal: React.FC<AuditLogModalProps> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [actionFilter, setActionFilter] = useState('');
  const [loading, setLoading] = useState(false);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await api.core.getAuditLog({
        limit: 100,
        action: actionFilter || undefined,
      });
      setLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) loadLogs();
  }, [isOpen, actionFilter]);

  if (!isOpen) return null;

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case 'CREATE':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'UPDATE':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'DELETE':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'CONFIG_CHANGE':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'EXTENSION_TOGGLE':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-150">
      <div className="w-full max-w-4xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-200 flex items-start justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-600 shadow-2xs">
              <History className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                Audit Trail & Governance Log
                <span className="text-xs px-2 py-0.5 rounded font-mono bg-purple-50 text-purple-700 border border-purple-200 font-semibold">
                  core.audit_log
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Immutable event stream recording all data mutations, configuration changes, and extension switches.
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

        {/* Filter bar */}
        <div className="px-4 sm:px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-700 text-xs font-medium outline-none"
            >
              <option value="">All Actions</option>
              <option value="CREATE">CREATE</option>
              <option value="UPDATE">UPDATE</option>
              <option value="DELETE">DELETE</option>
              <option value="CONFIG_CHANGE">CONFIG_CHANGE</option>
              <option value="EXTENSION_TOGGLE">EXTENSION_TOGGLE</option>
              <option value="LOGIN">LOGIN</option>
            </select>
          </div>

          <button
            type="button"
            onClick={loadLogs}
            disabled={loading}
            className="text-slate-600 hover:text-slate-900 font-medium flex items-center gap-1 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Log
          </button>
        </div>

        {/* Log table/list */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-2 flex-1">
          {logs.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">No audit records found.</div>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className="p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 text-xs space-y-1 transition-colors font-mono shadow-2xs"
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getActionBadgeColor(log.action)}`}>
                      {log.action}
                    </span>
                    <span className="text-slate-800 font-sans font-medium">{log.details}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5 font-sans">
                    <Clock className="w-3 h-3" />
                    {new Date(log.timestamp).toLocaleTimeString()} • {new Date(log.timestamp).toLocaleDateString()}
                  </div>
                </div>

                <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-0.5">
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3 text-slate-400" />
                    Actor: <span className="text-slate-700 font-sans font-medium">{log.username}</span>
                  </span>
                  {log.entity_id && (
                    <span>
                      Entity: <span className="text-blue-600 font-semibold">{log.entity_id}</span> ({log.entity_type})
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
