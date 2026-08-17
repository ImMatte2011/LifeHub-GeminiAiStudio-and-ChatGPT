import React, { useState, useEffect } from 'react';
import {
  Clock,
  Calendar,
  MapPin,
  BookOpen,
  UserCheck,
  Building2,
  Filter,
  Search,
  ArrowUpRight,
  Sparkles,
  Tag as TagIcon,
  CheckCircle2,
  CalendarDays,
  Star,
} from 'lucide-react';
import { TimelineItem, Tag } from '../../types/index.js';
import { api } from '../../services/api.js';

interface ChronologyTimelineViewProps {
  onSelectEntity: (id: string) => void;
}

export const ChronologyTimelineView: React.FC<ChronologyTimelineViewProps> = ({ onSelectEntity }) => {
  const [items, setItems] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedModule, setSelectedModule] = useState<string>('all');
  const [searchQ, setSearchQ] = useState('');

  const loadTimeline = async () => {
    setLoading(true);
    try {
      const res = await api.shared.getTimeline({
        limit: 100,
        module_name: selectedModule !== 'all' ? selectedModule : undefined,
      });
      setItems(res);
    } catch (err) {
      console.error('Failed to load timeline:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTimeline();
  }, [selectedModule]);

  const filteredItems = items.filter((item) => {
    if (!searchQ.trim()) return true;
    const q = searchQ.toLowerCase();
    const hasTag = Array.isArray(item.tags) && item.tags.some((t: Tag) => t.name.toLowerCase().includes(q));
    return (
      item.title.toLowerCase().includes(q) ||
      (item.subtitle && item.subtitle.toLowerCase().includes(q)) ||
      hasTag
    );
  });

  // Group items by relative date headers (e.g., "August 2026", "Recent Entries")
  const groupedTimeline = filteredItems.reduce((acc, item) => {
    const d = new Date(item.timestamp);
    const groupKey = isNaN(d.getTime())
      ? 'Undated'
      : d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    if (!acc[groupKey]) {
      acc[groupKey] = [];
    }
    acc[groupKey].push(item);
    return acc;
  }, {} as Record<string, TimelineItem[]>);

  const getItemBadge = (item: TimelineItem) => {
    switch (item.module_name) {
      case 'events':
        return {
          bg: 'bg-purple-50 text-purple-700 border-purple-200',
          dot: 'bg-purple-500',
          icon: <Calendar className="w-4 h-4 text-purple-600" />,
        };
      case 'places':
        return {
          bg: 'bg-amber-50 text-amber-700 border-amber-200',
          dot: 'bg-amber-500',
          icon: <MapPin className="w-4 h-4 text-amber-600" />,
        };
      case 'knowledge':
        return {
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          dot: 'bg-emerald-500',
          icon: <BookOpen className="w-4 h-4 text-emerald-600" />,
        };
      case 'people':
        return {
          bg: 'bg-blue-50 text-blue-700 border-blue-200',
          dot: 'bg-blue-500',
          icon: <UserCheck className="w-4 h-4 text-blue-600" />,
        };
      case 'buildings':
        return {
          bg: 'bg-rose-50 text-rose-700 border-rose-200',
          dot: 'bg-rose-500',
          icon: <Building2 className="w-4 h-4 text-rose-600" />,
        };
      default:
        return {
          bg: 'bg-slate-50 text-slate-700 border-slate-200',
          dot: 'bg-slate-500',
          icon: <Clock className="w-4 h-4 text-slate-600" />,
        };
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-600 shadow-2xs">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                Unified Chronology & Timeline
                <span className="text-xs px-2.5 py-0.5 rounded-full font-mono bg-purple-50 text-purple-700 border border-purple-200 font-semibold">
                  {filteredItems.length} Entries
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Consolidated chronological feed across calendar events, travel visits, personal contacts, and knowledge assets.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Module Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
          <span className="text-slate-400 font-medium mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Domain:
          </span>
          {[
            { id: 'all', label: 'All Activities' },
            { id: 'events', label: 'Events' },
            { id: 'places', label: 'Place Visits' },
            { id: 'knowledge', label: 'Knowledge Items' },
            { id: 'people', label: 'People' },
          ].map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setSelectedModule(m.id)}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                selectedModule === m.id
                  ? 'bg-purple-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search timeline..."
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-purple-600 focus:bg-white w-48 sm:w-64"
          />
        </div>
      </div>

      {/* Timeline Stream */}
      {loading ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400">
          <Clock className="w-8 h-8 animate-spin mx-auto mb-2 text-purple-600" />
          <span className="text-xs font-medium">Aggregating chronological data...</span>
        </div>
      ) : Object.keys(groupedTimeline).length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500">
          <CalendarDays className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800">No timeline activities found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Try adjusting your search query or enabling other domain modules in the instance settings.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedTimeline).map(([groupTitle, groupItems]) => {
            const itemsList: TimelineItem[] = groupItems as TimelineItem[];
            return (
            <div key={groupTitle} className="space-y-4">
              {/* Group Month/Year Header */}
              <div className="sticky top-16 z-20 bg-[#f8fafc]/90 backdrop-blur-xs py-1 flex items-center gap-3">
                <span className="text-xs font-bold font-mono uppercase tracking-wider text-slate-700 bg-white px-3 py-1 rounded-lg border border-slate-200 shadow-2xs">
                  {groupTitle}
                </span>
                <div className="h-px flex-1 bg-slate-200" />
              </div>

              {/* Items in Group */}
              <div className="relative pl-6 sm:pl-8 space-y-4 before:content-[''] before:absolute before:left-3 sm:before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {itemsList.map((item) => {
                  const badge = getItemBadge(item);
                  const formattedDate = new Date(item.timestamp).toLocaleString(undefined, {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <div
                      key={item.id}
                      onClick={() => onSelectEntity(item.entity_id)}
                      className="group relative bg-white border border-slate-200 hover:border-purple-300 rounded-2xl p-4 shadow-xs hover:shadow-md transition-all cursor-pointer"
                    >
                      {/* Timeline Dot Indicator */}
                      <div className="absolute -left-6 sm:-left-8 top-5 w-6 h-6 rounded-full bg-white border-2 border-slate-300 group-hover:border-purple-600 flex items-center justify-center -translate-x-1/2 transition-colors">
                        <span className={`w-2 h-2 rounded-full ${badge.dot}`} />
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                        <div className="space-y-1.5 flex-1 min-w-0">
                          {/* Metadata row */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase border ${badge.bg}`}
                            >
                              {item.module_name}
                            </span>
                            <span className="text-[11px] font-mono text-slate-400">
                              {formattedDate}
                            </span>
                            {item.meta?.rating && (
                              <div className="flex items-center gap-0.5 text-amber-500 text-xs font-semibold">
                                <Star className="w-3 h-3 fill-amber-400" />
                                <span>{item.meta.rating}/5</span>
                              </div>
                            )}
                          </div>

                          {/* Title */}
                          <h4 className="text-sm font-bold text-slate-900 group-hover:text-purple-600 transition-colors">
                            {item.title}
                          </h4>

                          {/* Subtitle / Notes */}
                          {item.subtitle && (
                            <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                              {item.subtitle}
                            </p>
                          )}

                          {/* Tags */}
                          {Array.isArray(item.tags) && item.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 pt-1">
                              {item.tags.map((t: Tag) => (
                                <span
                                  key={t.id}
                                  className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600"
                                >
                                  #{t.name}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Quick Action Button */}
                        <div className="shrink-0 flex items-center gap-1 self-start pt-1 text-slate-400 group-hover:text-purple-600">
                          <span className="text-[11px] font-semibold hidden sm:inline">Inspect</span>
                          <ArrowUpRight className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
