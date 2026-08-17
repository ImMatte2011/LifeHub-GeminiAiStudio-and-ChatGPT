import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Plus,
  Search,
  Filter,
  MapPin,
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  Trash2,
  X,
} from 'lucide-react';
import { EventItem, Tag, Place, Person } from '../../types/index.js';
import { api } from '../../services/api.js';
import { TagPicker } from '../../components/shared/TagPicker.js';

interface EventsViewProps {
  onSelectEntity: (id: string) => void;
  openCreateTrigger?: boolean;
  onResetCreateTrigger?: () => void;
}

export const EventsView: React.FC<EventsViewProps> = ({
  onSelectEntity,
  openCreateTrigger,
  onResetCreateTrigger,
}) => {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQ, setSearchQ] = useState('');
  const [loading, setLoading] = useState(false);

  // Creation modal
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_time: new Date().toISOString().slice(0, 16),
    end_time: '',
    is_all_day: false,
    place_id: '',
    status: 'planned' as const,
    tags: [] as string[],
    participant_ids: [] as string[],
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [evList, tList, plRes, pList] = await Promise.all([
        api.events.list(),
        api.shared.getTags(),
        api.places.list(),
        api.people.list(),
      ]);
      setEvents(evList);
      setAllTags(tList);
      setPlaces(plRes.places);
      setPeople(pList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (openCreateTrigger) {
      setIsCreating(true);
      if (onResetCreateTrigger) onResetCreateTrigger();
    }
  }, [openCreateTrigger]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    try {
      await api.events.create({
        title: formData.title,
        description: formData.description,
        start_time: formData.start_time,
        end_time: formData.end_time || undefined,
        is_all_day: formData.is_all_day,
        place_id: formData.place_id || undefined,
        status: formData.status,
        tags: formData.tags,
        participants: formData.participant_ids.map((pid) => ({ person_id: pid, role: 'attendee' })),
      });

      setIsCreating(false);
      setFormData({
        title: '',
        description: '',
        start_time: new Date().toISOString().slice(0, 16),
        end_time: '',
        is_all_day: false,
        place_id: '',
        status: 'planned',
        tags: [],
        participant_ids: [],
      });
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this event?')) return;
    try {
      await api.events.delete(id);
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredEvents = events.filter((ev) => {
    const q = searchQ.toLowerCase();
    const matchesSearch =
      !q || ev.title.toLowerCase().includes(q) || (ev.description && ev.description.toLowerCase().includes(q));
    const matchesStatus = !statusFilter || ev.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'planned':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'in_progress':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'completed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'cancelled':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-purple-600" />
            Events & Timeline
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Module <code className="text-blue-600 font-mono">events</code> • Cross-module integration with <code className="text-blue-600 font-mono">people</code> and <code className="text-blue-600 font-mono">places</code>.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreating(true)}
          className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold flex items-center gap-2 shadow-sm shadow-purple-500/20 transition-all"
        >
          <Plus className="w-4 h-4" /> Add Event
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3 bg-white border border-slate-200 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs shadow-2xs">
        <div className="flex items-center gap-2 flex-1 min-w-[200px] max-w-md">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search events by title or description..."
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            className="bg-transparent text-slate-900 placeholder:text-slate-400 w-full outline-none text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded text-slate-700 text-xs outline-none focus:border-purple-500"
          >
            <option value="">All Statuses</option>
            <option value="planned">Planned</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Events Timeline / Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredEvents.map((ev) => (
          <div
            key={ev.id}
            onClick={() => onSelectEntity(ev.id)}
            className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 cursor-pointer transition-all hover:scale-[1.01] flex flex-col justify-between space-y-4 group shadow-2xs hover:shadow-md"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center font-bold text-purple-600 text-base shadow-2xs">
                    <CalendarIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-slate-900 group-hover:text-purple-700 transition-colors">
                      {ev.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-mono font-semibold border ${getStatusBadge(ev.status)}`}>
                        {ev.status}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => handleDelete(e, ev.id)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-all"
                  title="Delete event"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {ev.description && (
                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {ev.description}
                </p>
              )}
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
              <div className="flex items-center gap-2 text-slate-500 font-mono text-[11px]">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{new Date(ev.start_time).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
              </div>

              {ev.place && (
                <div className="flex items-center gap-1.5 text-amber-700 text-xs font-medium">
                  <MapPin className="w-3.5 h-3.5 text-amber-500" />
                  <span className="truncate">{ev.place.name}</span>
                </div>
              )}

              {ev.participants && ev.participants.length > 0 && (
                <div className="flex items-center gap-1.5 text-slate-600 text-xs">
                  <Users className="w-3.5 h-3.5 text-blue-600" />
                  <span>
                    {ev.participants.map((p) => p.person ? `${p.person.first_name}` : 'Guest').join(', ')}
                  </span>
                </div>
              )}

              {/* Tags */}
              {ev.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {ev.tags.map((t) => (
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
        ))}
      </div>

      {/* Create Modal */}
      {isCreating && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="w-full max-w-xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-purple-600" />
                Schedule Event
              </h2>
              <button
                onClick={() => setIsCreating(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-4 sm:p-6 space-y-4 text-xs">
              <div>
                <label className="text-slate-700 block mb-1 font-medium">Event Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-purple-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 block mb-1 font-medium">Start Time</label>
                  <input
                    type="datetime-local"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-700 block mb-1 font-medium">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 outline-none"
                  >
                    <option value="planned">Planned</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-medium">Location (Linked Place)</label>
                <select
                  value={formData.place_id}
                  onChange={(e) => setFormData({ ...formData, place_id: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 outline-none"
                >
                  <option value="">No specific location</option>
                  {places.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.category})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-medium">Participants (Linked People)</label>
                <select
                  multiple
                  value={formData.participant_ids}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, (option: HTMLOptionElement) => option.value);
                    setFormData({ ...formData, participant_ids: selected });
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 outline-none h-24"
                >
                  {people.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.first_name} {p.last_name} {p.company ? `(${p.company})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-medium">Description</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-purple-500 outline-none resize-none"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="text-slate-700 block mb-1 font-medium">Assign Tags</label>
                <TagPicker
                  allTags={allTags}
                  selectedTagIds={formData.tags}
                  onChange={(tags) => setFormData({ ...formData, tags })}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 bg-slate-50 -mx-4 -mb-4 sm:-mx-6 sm:-mb-6 p-4 sm:p-6">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold shadow-xs"
                >
                  Save Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
