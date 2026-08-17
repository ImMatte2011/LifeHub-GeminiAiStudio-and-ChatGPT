import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  X,
  User,
  MapPin,
  Calendar,
  BookOpen,
  Building2,
  Sparkles,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { SearchResult } from '../../types/index.js';
import { api } from '../../services/api.js';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectEntity: (id: string, module: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectEntity,
}) => {
  const [query, setQuery] = useState('');
  const [selectedModule, setSelectedModule] = useState<string>('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isTrgmActive, setIsTrgmActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      handleSearch('', '');
    }
  }, [isOpen]);

  const handleSearch = async (q: string, moduleFilter?: string) => {
    setLoading(true);
    try {
      const data = await api.search.query(q, moduleFilter || undefined);
      setResults(data.results);
      setTotalCount(data.total);
      setIsTrgmActive(data.pg_trgm_enabled);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    handleSearch(val, selectedModule);
  };

  const handleModuleFilter = (mod: string) => {
    const nextMod = selectedModule === mod ? '' : mod;
    setSelectedModule(nextMod);
    handleSearch(query, nextMod);
  };

  if (!isOpen) return null;

  const getModuleIcon = (mod: string) => {
    switch (mod) {
      case 'people':
        return <User className="w-4 h-4 text-blue-600" />;
      case 'places':
        return <MapPin className="w-4 h-4 text-amber-600" />;
      case 'events':
        return <Calendar className="w-4 h-4 text-purple-600" />;
      case 'knowledge':
        return <BookOpen className="w-4 h-4 text-emerald-600" />;
      case 'buildings':
        return <Building2 className="w-4 h-4 text-rose-600" />;
      default:
        return <Search className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-start justify-center p-4 sm:p-6 md:p-12 overflow-y-auto animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto">
        {/* Search Header */}
        <div className="p-4 border-b border-slate-200 flex items-center gap-3 bg-white">
          <Search className="w-5 h-5 text-blue-600 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search across all modules, contacts, places, events, JSONB properties, tags..."
            value={query}
            onChange={handleQueryChange}
            className="flex-1 bg-transparent text-slate-900 placeholder:text-slate-400 text-sm md:text-base outline-none"
          />
          {query && (
            <button
              onClick={() => {
                setQuery('');
                handleSearch('', selectedModule);
              }}
              className="text-slate-400 hover:text-slate-700 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono bg-slate-100 text-slate-500 rounded border border-slate-200 font-semibold">
            ESC
          </kbd>
        </div>

        {/* Filters and Capabilities Bar */}
        <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
            <span className="text-slate-500 flex items-center gap-1 mr-1 font-medium">
              <Filter className="w-3 h-3" /> Module:
            </span>
            {['people', 'places', 'events', 'knowledge', 'buildings'].map((mod) => (
              <button
                key={mod}
                type="button"
                onClick={() => handleModuleFilter(mod)}
                className={`px-2.5 py-1 rounded-lg capitalize text-xs font-medium transition-all ${
                  selectedModule === mod
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {mod}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-500">
            <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
              <Sparkles className="w-3 h-3 text-emerald-600" />
              {isTrgmActive ? 'pg_trgm fuzzy active' : 'FTS standard'}
            </span>
            <span>•</span>
            <span className="font-semibold text-slate-700">{totalCount} found</span>
          </div>
        </div>

        {/* Results List */}
        <div className="max-h-[60vh] overflow-y-auto p-3 space-y-1.5">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">
              Searching entities with trigram index...
            </div>
          ) : results.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <Search className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-sm text-slate-700 font-medium">No entities matched your search</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Try searching for names, cities, authors, calibers, tech stacks, or partial typos (handled via pg_trgm).
              </p>
            </div>
          ) : (
            results.map((r) => (
              <div
                key={r.id}
                onClick={() => {
                  onSelectEntity(r.id, r.module);
                  onClose();
                }}
                className="group p-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 cursor-pointer transition-all flex items-start justify-between gap-3 shadow-2xs"
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 group-hover:border-slate-300 shrink-0">
                    {getModuleIcon(r.module)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                        {r.title}
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-mono bg-slate-100 text-slate-600 border border-slate-200 font-medium">
                        {r.entity_type}
                      </span>
                      {r.match_type === 'trigram_fuzzy' && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-50 text-amber-700 border border-amber-200 font-semibold">
                          fuzzy match {Math.round(r.score * 100)}%
                        </span>
                      )}
                    </div>

                    {r.subtitle && (
                      <p className="text-xs text-slate-500 mt-0.5 truncate">{r.subtitle}</p>
                    )}

                    {r.preview && (
                      <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                        {r.preview}
                      </p>
                    )}

                    {r.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {r.tags.map((t) => (
                          <span
                            key={t.id}
                            className="px-2 py-0.5 rounded-full text-[10px] font-medium border"
                            style={{
                              backgroundColor: `${t.color}15`,
                              borderColor: `${t.color}40`,
                              color: t.color,
                            }}
                          >
                            {t.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-400 group-hover:text-blue-600 shrink-0">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-mono text-[10px] font-medium text-slate-700">↑</kbd>{' '}
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-mono text-[10px] font-medium text-slate-700">↓</kbd> to navigate
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-mono text-[10px] font-medium text-slate-700">↵</kbd> to open
            </span>
          </div>
          <button onClick={onClose} className="hover:text-slate-800 font-medium">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
