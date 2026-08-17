import React, { useState, useEffect } from 'react';
import {
  Database,
  Layers,
  Table as TableIcon,
  Columns,
  Key,
  Link as LinkIcon,
  Search,
  Split,
  ChevronRight,
  ArrowLeft,
  RefreshCw,
  Plus,
  FileCode,
  Shield,
  Sliders,
  Share2,
  Users,
  MapPin,
  Calendar,
  BookOpen,
  Building2,
  CheckCircle2,
  ExternalLink,
  Info,
  Copy,
  Check,
  Filter,
  ArrowRight,
  Maximize2,
} from 'lucide-react';
import { api } from '../../services/api.js';
import {
  DatabaseInfo,
  SchemaDefinition,
  TableDefinition,
  ColumnDefinition,
  ForeignKeyRelation,
} from '../../types/index.js';

interface DatabaseSchemaExplorerViewProps {
  initialDbId?: string;
  onSelectEntity?: (id: string, module: string) => void;
}

export const DatabaseSchemaExplorerView: React.FC<DatabaseSchemaExplorerViewProps> = ({
  initialDbId = 'lifehub_main',
}) => {
  // State
  const [databases, setDatabases] = useState<DatabaseInfo[]>([]);
  const [activeDbId, setActiveDbId] = useState<string>(initialDbId);
  const [schemas, setSchemas] = useState<SchemaDefinition[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // View Mode: 'explorer' (Single drill-down), 'split' (Dual 50/50 side-by-side), 'topology' (Global map)
  const [viewMode, setViewMode] = useState<'explorer' | 'split' | 'topology'>('explorer');

  // Single Explorer State
  const [selectedSchemaName, setSelectedSchemaName] = useState<string | null>(null);
  const [selectedTableName, setSelectedTableName] = useState<string | null>(null);
  const [activeTableTab, setActiveTableTab] = useState<'columns' | 'data' | 'relations' | 'ddl'>('columns');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Table Live Data State
  const [tableRecords, setTableRecords] = useState<any[]>([]);
  const [recordsTotal, setRecordsTotal] = useState<number>(0);
  const [dataSearch, setDataSearch] = useState<string>('');
  const [dataLoading, setDataLoading] = useState<boolean>(false);

  // Split-Screen Dual Mode State
  const [splitLeftDb, setSplitLeftDb] = useState<string>(initialDbId);
  const [splitLeftSchema, setSplitLeftSchema] = useState<string>('people');
  const [splitLeftTable, setSplitLeftTable] = useState<string>('persons');

  const [splitRightDb, setSplitRightDb] = useState<string>(initialDbId);
  const [splitRightSchema, setSplitRightSchema] = useState<string>('shared');
  const [splitRightTable, setSplitRightTable] = useState<string>('links');

  const [splitLeftSchemas, setSplitLeftSchemas] = useState<SchemaDefinition[]>([]);
  const [splitRightSchemas, setSplitRightSchemas] = useState<SchemaDefinition[]>([]);

  // Create Database Modal
  const [showCreateDbModal, setShowCreateDbModal] = useState<boolean>(false);
  const [newDbId, setNewDbId] = useState<string>('');
  const [newDbName, setNewDbName] = useState<string>('');
  const [newDbDescription, setNewDbDescription] = useState<string>('');
  const [newDbCategory, setNewDbCategory] = useState<string>('custom');

  // DDL Copy Feedback
  const [copiedDdl, setCopiedDdl] = useState<boolean>(false);

  // 1. Fetch Databases list
  const fetchDatabases = async () => {
    try {
      setLoading(true);
      const res = await api.databases.list();
      setDatabases(res.databases);
      if (!activeDbId && res.active_database_id) {
        setActiveDbId(res.active_database_id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load databases');
    } finally {
      setLoading(false);
    }
  };

  // 2. Fetch Schemas for active database
  const fetchSchemas = async (dbId: string) => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.databases.getSchemas(dbId);
      setSchemas(res.schemas);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch schemas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatabases();
  }, []);

  useEffect(() => {
    if (activeDbId) {
      fetchSchemas(activeDbId);
    }
  }, [activeDbId]);

  // Load split schemas
  useEffect(() => {
    if (viewMode === 'split') {
      api.databases.getSchemas(splitLeftDb).then((r) => setSplitLeftSchemas(r.schemas));
      api.databases.getSchemas(splitRightDb).then((r) => setSplitRightSchemas(r.schemas));
    }
  }, [viewMode, splitLeftDb, splitRightDb]);

  // Fetch Live Table Data
  useEffect(() => {
    if (selectedSchemaName && selectedTableName && activeTableTab === 'data') {
      setDataLoading(true);
      api.databases
        .getTableRecords(activeDbId, selectedSchemaName, selectedTableName, {
          search: dataSearch,
          limit: 50,
        })
        .then((res) => {
          setTableRecords(res.records);
          setRecordsTotal(res.total);
        })
        .catch(() => {
          setTableRecords([]);
          setRecordsTotal(0);
        })
        .finally(() => setDataLoading(false));
    }
  }, [activeDbId, selectedSchemaName, selectedTableName, activeTableTab, dataSearch]);

  const handleSwitchActiveDb = async (id: string) => {
    try {
      await api.databases.switchActive(id);
      setActiveDbId(id);
      setSelectedSchemaName(null);
      setSelectedTableName(null);
      fetchDatabases();
    } catch (err: any) {
      alert(err.message || 'Failed to switch active database');
    }
  };

  const handleCreateDatabase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDbId.trim() || !newDbName.trim()) return;

    try {
      await api.databases.create({
        id: newDbId.trim(),
        name: newDbName.trim(),
        description: newDbDescription.trim(),
        category: newDbCategory,
      });
      setShowCreateDbModal(false);
      setNewDbId('');
      setNewDbName('');
      setNewDbDescription('');
      fetchDatabases();
    } catch (err: any) {
      alert(err.message || 'Failed to create database');
    }
  };

  const selectedSchema = schemas.find((s) => s.name === selectedSchemaName);
  const selectedTable = selectedSchema?.tables.find((t) => t.name === selectedTableName) || selectedSchema?.tables[0];

  // Helper for Schema Color Accents
  const getSchemaColorClasses = (color: string) => {
    switch (color) {
      case 'blue':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          text: 'text-blue-700',
          badge: 'bg-blue-100 text-blue-800',
          dot: 'bg-blue-500',
          hover: 'hover:border-blue-400 hover:shadow-blue-500/10',
        };
      case 'amber':
        return {
          bg: 'bg-amber-50',
          border: 'border-amber-200',
          text: 'text-amber-700',
          badge: 'bg-amber-100 text-amber-800',
          dot: 'bg-amber-500',
          hover: 'hover:border-amber-400 hover:shadow-amber-500/10',
        };
      case 'emerald':
        return {
          bg: 'bg-emerald-50',
          border: 'border-emerald-200',
          text: 'text-emerald-700',
          badge: 'bg-emerald-100 text-emerald-800',
          dot: 'bg-emerald-500',
          hover: 'hover:border-emerald-400 hover:shadow-emerald-500/10',
        };
      case 'indigo':
        return {
          bg: 'bg-indigo-50',
          border: 'border-indigo-200',
          text: 'text-indigo-700',
          badge: 'bg-indigo-100 text-indigo-800',
          dot: 'bg-indigo-500',
          hover: 'hover:border-indigo-400 hover:shadow-indigo-500/10',
        };
      case 'rose':
        return {
          bg: 'bg-rose-50',
          border: 'border-rose-200',
          text: 'text-rose-700',
          badge: 'bg-rose-100 text-rose-800',
          dot: 'bg-rose-500',
          hover: 'hover:border-rose-400 hover:shadow-rose-500/10',
        };
      case 'purple':
        return {
          bg: 'bg-purple-50',
          border: 'border-purple-200',
          text: 'text-purple-700',
          badge: 'bg-purple-100 text-purple-800',
          dot: 'bg-purple-500',
          hover: 'hover:border-purple-400 hover:shadow-purple-500/10',
        };
      case 'sky':
        return {
          bg: 'bg-sky-50',
          border: 'border-sky-200',
          text: 'text-sky-700',
          badge: 'bg-sky-100 text-sky-800',
          dot: 'bg-sky-500',
          hover: 'hover:border-sky-400 hover:shadow-sky-500/10',
        };
      default:
        return {
          bg: 'bg-slate-50',
          border: 'border-slate-200',
          text: 'text-slate-700',
          badge: 'bg-slate-100 text-slate-800',
          dot: 'bg-slate-500',
          hover: 'hover:border-slate-400 hover:shadow-slate-500/10',
        };
    }
  };

  const getSchemaIcon = (name: string) => {
    switch (name) {
      case 'core':
        return <Shield className="w-5 h-5" />;
      case 'meta':
        return <Sliders className="w-5 h-5" />;
      case 'shared':
        return <Share2 className="w-5 h-5" />;
      case 'people':
        return <Users className="w-5 h-5" />;
      case 'places':
        return <MapPin className="w-5 h-5" />;
      case 'events':
        return <Calendar className="w-5 h-5" />;
      case 'knowledge':
        return <BookOpen className="w-5 h-5" />;
      case 'buildings':
        return <Building2 className="w-5 h-5" />;
      default:
        return <Database className="w-5 h-5" />;
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedDdl(true);
    setTimeout(() => setCopiedDdl(false), 2000);
  };

  // Filtered schemas
  const filteredSchemas = schemas.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.display_name.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q) ||
      s.tables.some((t) => t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. TOP CONTROLS & DATABASE SELECTOR BAR */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Left: Active Database Info & Selector */}
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20 shrink-0">
            <Database className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <label htmlFor="active-db-select" className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Active Database:
              </label>
              <select
                id="active-db-select"
                value={activeDbId}
                onChange={(e) => handleSwitchActiveDb(e.target.value)}
                className="font-bold text-sm text-slate-900 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                {databases.map((db) => (
                  <option key={db.id} value={db.id}>
                    {db.name} ({db.id})
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setShowCreateDbModal(true)}
                className="px-2 py-1 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors flex items-center gap-1"
                title="Create New Database"
              >
                <Plus className="w-3 h-3" />
                <span>New DB</span>
              </button>
            </div>
            <p className="text-xs text-slate-500 truncate mt-0.5">
              {databases.find((d) => d.id === activeDbId)?.description || 'Multi-domain PostgreSQL Architecture'}
            </p>
          </div>
        </div>

        {/* Right: View Mode Switcher (Single Drill-down vs 50/50 Split-Screen vs Topology) */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0 self-stretch md:self-auto justify-between md:justify-start">
          <button
            type="button"
            onClick={() => setViewMode('explorer')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              viewMode === 'explorer'
                ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-blue-600" />
            <span>Schema Inspector</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('split')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              viewMode === 'split'
                ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Split className="w-3.5 h-3.5 text-purple-600" />
            <span>Dividi Schermo (50/50)</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('topology')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              viewMode === 'topology'
                ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Share2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Topology</span>
          </button>
        </div>
      </div>

      {/* ERROR STATE */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
          <Info className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW MODE 1: SINGLE SCHEMA EXPLORER & DRILL-DOWN */}
      {/* ========================================================================= */}
      {viewMode === 'explorer' && (
        <div className="space-y-6">
          {/* If NO schema is drilled down: Show All Schemas Cards Grid */}
          {!selectedSchemaName ? (
            <div className="space-y-4">
              {/* Search & Filter Header */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <span>Database Schemas ({filteredSchemas.length})</span>
                    <span className="text-xs font-normal text-slate-500 font-mono">
                      in {databases.find((d) => d.id === activeDbId)?.name}
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    Click on any schema card to drill down into its tables, columns, live rows, and foreign key relations.
                  </p>
                </div>

                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filter schemas or tables..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Grid of Schemas */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredSchemas.map((schema) => {
                  const style = getSchemaColorClasses(schema.color);
                  return (
                    <div
                      key={schema.name}
                      onClick={() => {
                        setSelectedSchemaName(schema.name);
                        setSelectedTableName(schema.tables[0]?.name || null);
                      }}
                      className={`bg-white rounded-2xl border p-4 transition-all cursor-pointer shadow-2xs hover:shadow-md flex flex-col justify-between ${style.border} ${style.hover} group`}
                    >
                      <div className="space-y-3">
                        {/* Schema Header */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center ${style.bg} ${style.text}`}
                            >
                              {getSchemaIcon(schema.name)}
                            </div>
                            <div>
                              <h3 className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition-colors">
                                {schema.name}
                              </h3>
                              <span className="text-[11px] text-slate-500 font-medium block">
                                {schema.display_name}
                              </span>
                            </div>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-mono uppercase font-semibold ${style.badge}`}
                          >
                            {schema.category}
                          </span>
                        </div>

                        {/* Description */}
                        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                          {schema.description}
                        </p>

                        {/* Tables List Preview */}
                        <div className="space-y-1.5 pt-1">
                          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 font-mono">
                            Tables ({schema.tables.length})
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {schema.tables.map((tbl) => (
                              <span
                                key={tbl.name}
                                className="px-2 py-0.5 rounded-md text-[11px] font-mono bg-slate-100 text-slate-700 border border-slate-200"
                              >
                                {tbl.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Footer Stats & Open CTA */}
                      <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <div className="flex items-center gap-3 font-mono text-[11px]">
                          <span>
                            <strong>{schema.total_tables}</strong> tables
                          </span>
                          <span>•</span>
                          <span>
                            <strong>{schema.total_rows}</strong> rows
                          </span>
                        </div>
                        <span className="text-blue-600 font-semibold text-xs flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                          Inspect <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* DRILL DOWN INSIDE A SPECIFIC SCHEMA */
            <div className="space-y-5">
              {/* Breadcrumbs & Navigation Header */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSchemaName(null);
                      setSelectedTableName(null);
                    }}
                    className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-semibold px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>All Schemas</span>
                  </button>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-mono text-slate-500">{activeDbId}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded font-mono">
                    {selectedSchema?.name}
                  </span>
                  {selectedTable && (
                    <>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded font-mono">
                        {selectedTable.name}
                      </span>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">
                    Schema Category:{' '}
                    <strong className="text-slate-800 uppercase font-mono">{selectedSchema?.category}</strong>
                  </span>
                </div>
              </div>

              {/* Schema Details & Tables Navigation Container */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Left Column: Tables in this Schema */}
                <div className="lg:col-span-1 bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
                      Tables ({selectedSchema?.tables.length})
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {selectedSchema?.total_rows} total rows
                    </span>
                  </div>

                  <div className="space-y-1">
                    {selectedSchema?.tables.map((table) => {
                      const isTblActive = (selectedTableName || selectedSchema.tables[0]?.name) === table.name;
                      return (
                        <button
                          key={table.name}
                          type="button"
                          onClick={() => setSelectedTableName(table.name)}
                          className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-mono font-medium transition-all flex items-center justify-between ${
                            isTblActive
                              ? 'bg-blue-600 text-white shadow-xs font-semibold'
                              : 'text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <TableIcon className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{table.name}</span>
                          </div>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] ${
                              isTblActive ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {table.row_count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Right Column: Active Table Inspector */}
                <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
                  {selectedTable ? (
                    <div>
                      {/* Table Header Info */}
                      <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold text-slate-900 font-mono">
                              {selectedSchema?.name}.{selectedTable.name}
                            </h3>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-blue-100 text-blue-800 font-semibold">
                              {selectedTable.row_count} records
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">{selectedTable.description}</p>
                        </div>

                        {/* Inspector Sub-Tabs */}
                        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200">
                          <button
                            type="button"
                            onClick={() => setActiveTableTab('columns')}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                              activeTableTab === 'columns'
                                ? 'bg-blue-50 text-blue-700 font-semibold'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            Columns ({selectedTable.columns.length})
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveTableTab('data')}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                              activeTableTab === 'data'
                                ? 'bg-blue-50 text-blue-700 font-semibold'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            Live Records
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveTableTab('relations')}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                              activeTableTab === 'relations'
                                ? 'bg-blue-50 text-blue-700 font-semibold'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            Foreign Keys ({selectedTable.foreign_keys.length})
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveTableTab('ddl')}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                              activeTableTab === 'ddl'
                                ? 'bg-blue-50 text-blue-700 font-semibold'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            DDL SQL
                          </button>
                        </div>
                      </div>

                      {/* SUB-TAB 1: COLUMNS DEFINITIONS */}
                      {activeTableTab === 'columns' && (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-500 font-mono text-[11px] uppercase tracking-wider">
                                <th className="py-2.5 px-4 font-semibold">Column Name</th>
                                <th className="py-2.5 px-4 font-semibold">Data Type</th>
                                <th className="py-2.5 px-4 font-semibold">Key / Constraint</th>
                                <th className="py-2.5 px-4 font-semibold">Nullable</th>
                                <th className="py-2.5 px-4 font-semibold">Default / Indexes</th>
                                <th className="py-2.5 px-4 font-semibold">Description</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-mono">
                              {selectedTable.columns.map((col) => (
                                <tr key={col.name} className="hover:bg-slate-50/80 transition-colors">
                                  {/* Column Name */}
                                  <td className="py-2.5 px-4 font-bold text-slate-900 flex items-center gap-1.5">
                                    {col.is_pk && <Key className="w-3 h-3 text-amber-500 shrink-0" />}
                                    {col.is_fk && <LinkIcon className="w-3 h-3 text-blue-500 shrink-0" />}
                                    <span>{col.name}</span>
                                  </td>

                                  {/* Data Type */}
                                  <td className="py-2.5 px-4">
                                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-semibold border border-slate-200">
                                      {col.type}
                                    </span>
                                  </td>

                                  {/* Key Status */}
                                  <td className="py-2.5 px-4">
                                    {col.is_pk && (
                                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 mr-1">
                                        PRIMARY KEY
                                      </span>
                                    )}
                                    {col.is_fk && col.fk_target && (
                                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                                        FK → {col.fk_target}
                                      </span>
                                    )}
                                    {!col.is_pk && !col.is_fk && <span className="text-slate-400">—</span>}
                                  </td>

                                  {/* Nullable */}
                                  <td className="py-2.5 px-4">
                                    <span
                                      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                                        col.is_nullable
                                          ? 'bg-slate-100 text-slate-600'
                                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                                      }`}
                                    >
                                      {col.is_nullable ? 'NULL' : 'NOT NULL'}
                                    </span>
                                  </td>

                                  {/* Default & Indexes */}
                                  <td className="py-2.5 px-4 text-slate-600 text-[11px]">
                                    {col.default_value && (
                                      <span className="text-emerald-700 bg-emerald-50 px-1 rounded mr-1">
                                        def: {col.default_value}
                                      </span>
                                    )}
                                    {col.indexes?.map((idx) => (
                                      <span
                                        key={idx}
                                        className="text-[10px] bg-purple-50 text-purple-700 border border-purple-200 px-1.5 py-0.5 rounded mr-1"
                                      >
                                        idx: {idx}
                                      </span>
                                    ))}
                                    {!col.default_value && (!col.indexes || col.indexes.length === 0) && (
                                      <span className="text-slate-400">—</span>
                                    )}
                                  </td>

                                  {/* Description */}
                                  <td className="py-2.5 px-4 text-slate-500 font-sans text-xs">
                                    {col.description || '—'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {/* SUB-TAB 2: LIVE RECORDS BROWSER */}
                      {activeTableTab === 'data' && (
                        <div className="p-4 space-y-4">
                          <div className="flex items-center justify-between gap-3">
                            <div className="relative flex-1 max-w-sm">
                              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                              <input
                                type="text"
                                value={dataSearch}
                                onChange={(e) => setDataSearch(e.target.value)}
                                placeholder={`Search live rows in ${selectedTable.name}...`}
                                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            <span className="text-xs text-slate-500 font-mono">
                              Showing {tableRecords.length} of {recordsTotal} records
                            </span>
                          </div>

                          {dataLoading ? (
                            <div className="py-12 text-center text-slate-400 flex items-center justify-center gap-2">
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              <span>Loading records from database...</span>
                            </div>
                          ) : tableRecords.length === 0 ? (
                            <div className="py-12 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-500 text-xs">
                              No records found in {selectedSchema?.name}.{selectedTable.name}
                            </div>
                          ) : (
                            <div className="overflow-x-auto border border-slate-200 rounded-xl">
                              <table className="w-full text-left text-xs border-collapse font-mono">
                                <thead>
                                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 text-[11px]">
                                    {Object.keys(tableRecords[0]).map((key) => (
                                      <th key={key} className="py-2 px-3 font-semibold whitespace-nowrap">
                                        {key}
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {tableRecords.map((row, idx) => (
                                    <tr key={row.id || idx} className="hover:bg-slate-50 transition-colors">
                                      {Object.entries(row).map(([k, val]: [string, any]) => (
                                        <td
                                          key={k}
                                          className="py-2 px-3 text-slate-800 text-[11px] max-w-xs truncate whitespace-nowrap"
                                          title={typeof val === 'object' ? JSON.stringify(val) : String(val)}
                                        >
                                          {typeof val === 'object' && val !== null ? (
                                            <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[10px]">
                                              JSON {Array.isArray(val) ? `[${val.length}]` : '{...}'}
                                            </span>
                                          ) : val === true ? (
                                            <span className="text-emerald-600 font-bold">true</span>
                                          ) : val === false ? (
                                            <span className="text-rose-600 font-bold">false</span>
                                          ) : val === null || val === undefined ? (
                                            <span className="text-slate-400 italic">null</span>
                                          ) : (
                                            String(val)
                                          )}
                                        </td>
                                      ))}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      )}

                      {/* SUB-TAB 3: FOREIGN KEYS & RELATIONS */}
                      {activeTableTab === 'relations' && (
                        <div className="p-5 space-y-4">
                          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
                            Foreign Key Constraints & Cross-References
                          </h4>

                          {selectedTable.foreign_keys.length === 0 ? (
                            <div className="p-6 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center text-slate-500 text-xs">
                              This table has no outbound foreign keys.
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {selectedTable.foreign_keys.map((fk) => (
                                <div
                                  key={fk.constraint_name}
                                  className="p-4 rounded-xl border border-blue-200 bg-blue-50/50 flex items-center justify-between gap-4"
                                >
                                  <div className="space-y-1 font-mono text-xs">
                                    <div className="font-bold text-slate-900 flex items-center gap-2">
                                      <LinkIcon className="w-3.5 h-3.5 text-blue-600" />
                                      <span>Constraint: {fk.constraint_name}</span>
                                    </div>
                                    <div className="text-slate-600 flex items-center gap-2 text-[11px]">
                                      <span className="bg-white px-2 py-0.5 rounded border border-slate-200 font-bold text-slate-800">
                                        {selectedSchema?.name}.{selectedTable.name}({fk.column})
                                      </span>
                                      <ArrowRight className="w-3.5 h-3.5 text-blue-500" />
                                      <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-bold">
                                        {fk.target_schema}.{fk.target_table}({fk.target_column})
                                      </span>
                                    </div>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedSchemaName(fk.target_schema);
                                      setSelectedTableName(fk.target_table);
                                    }}
                                    className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-xs font-semibold text-blue-600 hover:bg-blue-50 transition-colors shrink-0"
                                  >
                                    Jump to Target Table
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* SUB-TAB 4: DDL SQL */}
                      {activeTableTab === 'ddl' && (
                        <div className="p-5 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-mono text-slate-500">
                              PostgreSQL 16 Schema Definition
                            </span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(selectedTable.ddl)}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-colors"
                            >
                              {copiedDdl ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  <span className="text-emerald-600">Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>Copy DDL</span>
                                </>
                              )}
                            </button>
                          </div>
                          <pre className="p-4 bg-slate-900 text-emerald-400 font-mono text-xs rounded-xl overflow-x-auto border border-slate-800 leading-relaxed">
                            {selectedTable.ddl}
                          </pre>
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW MODE 2: DUAL SPLIT-SCREEN (50/50 SIDE-BY-SIDE COMPARATOR) */}
      {/* ========================================================================= */}
      {viewMode === 'split' && (
        <div className="space-y-4">
          <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-purple-900 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Split className="w-4 h-4 text-purple-600 shrink-0" />
              <span>
                <strong>Dual Schema Comparator (50/50 View):</strong> Inspect two schemas side-by-side (same or different databases), compare table structures, foreign keys, and live records simultaneously.
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* LEFT PANEL */}
            <div className="bg-white rounded-2xl border-2 border-blue-200 shadow-xs p-4 sm:p-5 space-y-4">
              {/* Left Selector Header */}
              <div className="space-y-3 pb-3 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-700 font-mono flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                    Left Schema Panel
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 uppercase">Database:</label>
                    <select
                      value={splitLeftDb}
                      onChange={(e) => setSplitLeftDb(e.target.value)}
                      className="w-full text-xs font-bold text-slate-800 bg-slate-50 border border-slate-300 rounded-lg p-1.5"
                    >
                      {databases.map((db) => (
                        <option key={db.id} value={db.id}>
                          {db.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 uppercase">Schema:</label>
                    <select
                      value={splitLeftSchema}
                      onChange={(e) => {
                        setSplitLeftSchema(e.target.value);
                        const s = splitLeftSchemas.find((sc) => sc.name === e.target.value);
                        if (s && s.tables[0]) setSplitLeftTable(s.tables[0].name);
                      }}
                      className="w-full text-xs font-bold text-slate-800 bg-slate-50 border border-slate-300 rounded-lg p-1.5"
                    >
                      {splitLeftSchemas.map((s) => (
                        <option key={s.name} value={s.name}>
                          {s.name} ({s.tables.length} tables)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Left Table Selector */}
                {(() => {
                  const leftSchemaObj = splitLeftSchemas.find((s) => s.name === splitLeftSchema);
                  return (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {leftSchemaObj?.tables.map((t) => (
                        <button
                          key={t.name}
                          type="button"
                          onClick={() => setSplitLeftTable(t.name)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-colors ${
                            splitLeftTable === t.name
                              ? 'bg-blue-600 text-white font-bold'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {t.name} ({t.row_count})
                        </button>
                      ))}
                    </div>
                  );
                })()}
              </div>

              {/* Left Table Content View */}
              {(() => {
                const leftSchemaObj = splitLeftSchemas.find((s) => s.name === splitLeftSchema);
                const leftTbl =
                  leftSchemaObj?.tables.find((t) => t.name === splitLeftTable) || leftSchemaObj?.tables[0];

                if (!leftTbl) return <div className="text-xs text-slate-400">Select a table</div>;

                return (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="font-bold text-slate-900">
                        {splitLeftSchema}.{leftTbl.name}
                      </span>
                      <span className="text-slate-500">{leftTbl.columns.length} columns</span>
                    </div>

                    <div className="border border-slate-200 rounded-xl overflow-x-auto max-h-96">
                      <table className="w-full text-left text-xs font-mono">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] uppercase">
                          <tr>
                            <th className="p-2">Column</th>
                            <th className="p-2">Type</th>
                            <th className="p-2">Key</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {leftTbl.columns.map((col) => (
                            <tr key={col.name} className="hover:bg-slate-50">
                              <td className="p-2 font-semibold text-slate-900">{col.name}</td>
                              <td className="p-2 text-slate-600">{col.type}</td>
                              <td className="p-2">
                                {col.is_pk && <span className="text-amber-600 font-bold">PK</span>}
                                {col.is_fk && (
                                  <span className="text-blue-600 font-bold ml-1">FK→{col.fk_target}</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* DDL Preview */}
                    <div className="pt-2">
                      <div className="text-[10px] font-semibold text-slate-400 uppercase font-mono">
                        PostgreSQL DDL:
                      </div>
                      <pre className="p-2.5 bg-slate-900 text-emerald-400 text-[10px] font-mono rounded-lg overflow-x-auto max-h-36">
                        {leftTbl.ddl}
                      </pre>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* RIGHT PANEL */}
            <div className="bg-white rounded-2xl border-2 border-purple-200 shadow-xs p-4 sm:p-5 space-y-4">
              {/* Right Selector Header */}
              <div className="space-y-3 pb-3 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-700 font-mono flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />
                    Right Schema Panel
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 uppercase">Database:</label>
                    <select
                      value={splitRightDb}
                      onChange={(e) => setSplitRightDb(e.target.value)}
                      className="w-full text-xs font-bold text-slate-800 bg-slate-50 border border-slate-300 rounded-lg p-1.5"
                    >
                      {databases.map((db) => (
                        <option key={db.id} value={db.id}>
                          {db.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 uppercase">Schema:</label>
                    <select
                      value={splitRightSchema}
                      onChange={(e) => {
                        setSplitRightSchema(e.target.value);
                        const s = splitRightSchemas.find((sc) => sc.name === e.target.value);
                        if (s && s.tables[0]) setSplitRightTable(s.tables[0].name);
                      }}
                      className="w-full text-xs font-bold text-slate-800 bg-slate-50 border border-slate-300 rounded-lg p-1.5"
                    >
                      {splitRightSchemas.map((s) => (
                        <option key={s.name} value={s.name}>
                          {s.name} ({s.tables.length} tables)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Right Table Selector */}
                {(() => {
                  const rightSchemaObj = splitRightSchemas.find((s) => s.name === splitRightSchema);
                  return (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {rightSchemaObj?.tables.map((t) => (
                        <button
                          key={t.name}
                          type="button"
                          onClick={() => setSplitRightTable(t.name)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-colors ${
                            splitRightTable === t.name
                              ? 'bg-purple-600 text-white font-bold'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {t.name} ({t.row_count})
                        </button>
                      ))}
                    </div>
                  );
                })()}
              </div>

              {/* Right Table Content View */}
              {(() => {
                const rightSchemaObj = splitRightSchemas.find((s) => s.name === splitRightSchema);
                const rightTbl =
                  rightSchemaObj?.tables.find((t) => t.name === splitRightTable) || rightSchemaObj?.tables[0];

                if (!rightTbl) return <div className="text-xs text-slate-400">Select a table</div>;

                return (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="font-bold text-slate-900">
                        {splitRightSchema}.{rightTbl.name}
                      </span>
                      <span className="text-slate-500">{rightTbl.columns.length} columns</span>
                    </div>

                    <div className="border border-slate-200 rounded-xl overflow-x-auto max-h-96">
                      <table className="w-full text-left text-xs font-mono">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] uppercase">
                          <tr>
                            <th className="p-2">Column</th>
                            <th className="p-2">Type</th>
                            <th className="p-2">Key</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {rightTbl.columns.map((col) => (
                            <tr key={col.name} className="hover:bg-slate-50">
                              <td className="p-2 font-semibold text-slate-900">{col.name}</td>
                              <td className="p-2 text-slate-600">{col.type}</td>
                              <td className="p-2">
                                {col.is_pk && <span className="text-amber-600 font-bold">PK</span>}
                                {col.is_fk && (
                                  <span className="text-purple-600 font-bold ml-1">FK→{col.fk_target}</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* DDL Preview */}
                    <div className="pt-2">
                      <div className="text-[10px] font-semibold text-slate-400 uppercase font-mono">
                        PostgreSQL DDL:
                      </div>
                      <pre className="p-2.5 bg-slate-900 text-emerald-400 text-[10px] font-mono rounded-lg overflow-x-auto max-h-36">
                        {rightTbl.ddl}
                      </pre>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW MODE 3: RELATIONAL TOPOLOGY DIAGRAM */}
      {/* ========================================================================= */}
      {viewMode === 'topology' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Share2 className="w-5 h-5 text-emerald-600" />
              <span>Architectural Schema Topology & Foreign Key Flow</span>
            </h3>
            <p className="text-xs text-slate-500">
              Visual architectural map illustrating how Domain Modules and Shared Services link back to the Master Entity Registry in <code className="font-mono text-blue-600">core.entities</code>.
            </p>
          </div>

          <div className="p-6 bg-slate-950 rounded-2xl border border-slate-800 text-white font-mono text-xs space-y-6 overflow-x-auto">
            {/* Core Entity Centerpiece */}
            <div className="p-4 bg-blue-950/80 border-2 border-blue-500 rounded-xl text-center space-y-1 shadow-lg shadow-blue-500/10">
              <div className="font-bold text-blue-300 text-sm">core.entities (Master Entity Registry)</div>
              <div className="text-[11px] text-blue-400">
                Primary Root Anchor (PK id, entity_type, title, created_at, updated_at, created_by)
              </div>
            </div>

            {/* Arrows Downward */}
            <div className="text-center text-blue-400 font-bold text-base">
              ▲ Foreign Keys (id REFERENCES core.entities(id) ON DELETE CASCADE) ▲
            </div>

            {/* Domain Schemas Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
              <div className="p-3 bg-indigo-950/60 border border-indigo-500/40 rounded-xl text-center space-y-1">
                <div className="font-bold text-indigo-300">people.persons</div>
                <div className="text-[10px] text-slate-400">FK → core.entities</div>
              </div>

              <div className="p-3 bg-rose-950/60 border border-rose-500/40 rounded-xl text-center space-y-1">
                <div className="font-bold text-rose-300">places.places</div>
                <div className="text-[10px] text-slate-400">FK → core.entities</div>
              </div>

              <div className="p-3 bg-purple-950/60 border border-purple-500/40 rounded-xl text-center space-y-1">
                <div className="font-bold text-purple-300">events.events</div>
                <div className="text-[10px] text-slate-400">FK → core.entities</div>
              </div>

              <div className="p-3 bg-amber-950/60 border border-amber-500/40 rounded-xl text-center space-y-1">
                <div className="font-bold text-amber-300">knowledge.items</div>
                <div className="text-[10px] text-slate-400">FK → core.entities</div>
              </div>

              <div className="p-3 bg-sky-950/60 border border-sky-500/40 rounded-xl text-center space-y-1">
                <div className="font-bold text-sky-300">buildings.buildings</div>
                <div className="text-[10px] text-slate-400">FK → core.entities</div>
              </div>
            </div>

            {/* Cross-Cutting Shared Services Layer */}
            <div className="p-4 bg-emerald-950/60 border border-emerald-500/40 rounded-xl space-y-2">
              <div className="font-bold text-emerald-300 text-xs flex items-center justify-between">
                <span>shared Layer (Universal Cross-Domain Graph)</span>
                <span className="text-[10px] text-emerald-400 font-normal">
                  Connects any entity to any other entity
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-300">
                <div className="p-2 bg-slate-900/80 rounded border border-slate-800">
                  <span className="font-semibold text-emerald-400">shared.links:</span> connects source_entity_id ↔ target_entity_id
                </div>
                <div className="p-2 bg-slate-900/80 rounded border border-slate-800">
                  <span className="font-semibold text-emerald-400">shared.entity_tags:</span> binds shared.tags to any core.entities
                </div>
                <div className="p-2 bg-slate-900/80 rounded border border-slate-800">
                  <span className="font-semibold text-emerald-400">shared.entity_files:</span> associates media to any core.entities
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREATE NEW DATABASE */}
      {/* ========================================================================= */}
      {showCreateDbModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                  <Database className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-base text-slate-900">Create New Database</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateDbModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateDatabase} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Database ID (lowercase, alphanumeric, e.g. lifehub_iot):</label>
                <input
                  type="text"
                  required
                  value={newDbId}
                  onChange={(e) => setNewDbId(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
                  placeholder="lifehub_archive"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Database Display Name:</label>
                <input
                  type="text"
                  required
                  value={newDbName}
                  onChange={(e) => setNewDbName(e.target.value)}
                  placeholder="LifeHub Archive & Datasets"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Category Profile:</label>
                <select
                  value={newDbCategory}
                  onChange={(e) => setNewDbCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="primary">Primary Knowledge Hub</option>
                  <option value="finance">Finance & Investments</option>
                  <option value="research">Academic & Research Archive</option>
                  <option value="iot">Smart Home & Automation</option>
                  <option value="custom">Custom Clean Database</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Description:</label>
                <textarea
                  rows={2}
                  value={newDbDescription}
                  onChange={(e) => setNewDbDescription(e.target.value)}
                  placeholder="Description of the database scope and schemas..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateDbModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 shadow-sm transition-all"
                >
                  Create Database
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
