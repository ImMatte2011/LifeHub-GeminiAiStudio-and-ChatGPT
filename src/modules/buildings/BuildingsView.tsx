import React, { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  Search,
  MapPin,
  User,
  Layers,
  Sparkles,
  Trash2,
  X,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import { Building, Place, Person, Tag } from '../../types/index.js';
import { api } from '../../services/api.js';
import { TagPicker } from '../../components/shared/TagPicker.js';

interface BuildingsViewProps {
  onSelectEntity: (id: string) => void;
  openCreateTrigger?: boolean;
  onResetCreateTrigger?: () => void;
}

export const BuildingsView: React.FC<BuildingsViewProps> = ({
  onSelectEntity,
  openCreateTrigger,
  onResetCreateTrigger,
}) => {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [searchQ, setSearchQ] = useState('');
  const [loading, setLoading] = useState(false);

  // Creation modal
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    building_type: 'Server Facility',
    address: '',
    place_id: '',
    manager_person_id: '',
    floors_count: 2,
    total_area_sqm: 450,
    notes: '',
    tags: [] as string[],
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [bList, plRes, pList, tList] = await Promise.all([
        api.buildings.list(),
        api.places.list(),
        api.people.list(),
        api.shared.getTags(),
      ]);
      setBuildings(bList);
      setPlaces(plRes.places);
      setPeople(pList);
      setAllTags(tList);
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
    if (!formData.name.trim() || !formData.code.trim()) return;

    try {
      await api.buildings.create(formData);
      setIsCreating(false);
      setFormData({
        name: '',
        code: '',
        building_type: 'Server Facility',
        address: '',
        place_id: '',
        manager_person_id: '',
        floors_count: 2,
        total_area_sqm: 450,
        notes: '',
        tags: [],
      });
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this building asset?')) return;
    try {
      await api.buildings.delete(id);
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredBuildings = buildings.filter((b) => {
    const q = searchQ.toLowerCase();
    return (
      !q ||
      b.name.toLowerCase().includes(q) ||
      b.code.toLowerCase().includes(q) ||
      b.building_type.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-rose-600" />
            Buildings & Real Estate Assets
            <span className="text-xs px-2 py-0.5 rounded font-mono bg-rose-50 text-rose-700 border border-rose-200">
              Phase 12 Reusability Demo
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Demonstrating how a totally new domain module plugs into Core entities, shared tags, shared links, and extension requirements without modifying Core.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreating(true)}
          className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center gap-2 shadow-sm shadow-rose-500/20 transition-all"
        >
          <Plus className="w-4 h-4" /> Add Building
        </button>
      </div>

      {/* Proof of Architecture Notice */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 flex items-start gap-3 text-xs text-slate-700 shadow-2xs">
        <Sparkles className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-semibold text-slate-900">Phase 12 Decoupling Proof:</span>
          <p className="text-slate-500 leading-relaxed">
            This module registers assets into <code className="text-blue-600 font-mono">core.entities</code>, links to facility managers via <code className="text-blue-600 font-mono">people.persons</code>, binds locations from <code className="text-blue-600 font-mono">places.places</code>, and requires <code className="text-blue-600 font-mono">maps</code>. Disabling it in <code className="text-blue-600 font-mono">instance.yaml</code> leaves Core and all other modules completely operational.
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center gap-2 text-xs shadow-2xs">
        <Search className="w-4 h-4 text-slate-400 shrink-0" />
        <input
          type="text"
          placeholder="Search buildings by name, code, or facility type..."
          value={searchQ}
          onChange={(e) => setSearchQ(e.target.value)}
          className="bg-transparent text-slate-900 placeholder:text-slate-400 w-full outline-none text-xs"
        />
      </div>

      {/* Buildings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredBuildings.map((b) => (
          <div
            key={b.id}
            onClick={() => onSelectEntity(b.id)}
            className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 cursor-pointer transition-all hover:scale-[1.01] flex flex-col justify-between space-y-4 group shadow-2xs hover:shadow-md"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center font-bold text-rose-600 text-base shadow-2xs">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-sm text-slate-900 group-hover:text-rose-700 transition-colors">
                        {b.name}
                      </h3>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        {b.code}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{b.building_type}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => handleDelete(e, b.id)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-all"
                  title="Delete building"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono text-slate-600 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <span className="text-slate-400 text-[10px] block uppercase font-semibold">Total Area</span>
                  <span className="text-slate-900 font-semibold">{b.total_area_sqm} m²</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block uppercase font-semibold">Floors</span>
                  <span className="text-slate-900 font-semibold">{b.floors_count} levels</span>
                </div>
              </div>

              {b.notes && (
                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {b.notes}
                </p>
              )}
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
              {b.manager && (
                <div className="flex items-center gap-1.5 text-blue-700 font-medium">
                  <User className="w-3.5 h-3.5 text-blue-600" />
                  <span>Manager: {b.manager.first_name} {b.manager.last_name}</span>
                </div>
              )}

              {b.place && (
                <div className="flex items-center gap-1.5 text-amber-700 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-amber-600" />
                  <span className="truncate">{b.place.name} ({b.place.latitude}, {b.place.longitude})</span>
                </div>
              )}

              {/* Tags */}
              {b.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {b.tags.map((t) => (
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
                <Building2 className="w-5 h-5 text-rose-600" />
                Add Building Facility
              </h2>
              <button
                onClick={() => setIsCreating(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-4 sm:p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 block mb-1 font-medium">Facility Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-rose-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-700 block mb-1 font-mono font-medium">Code Identifier *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BLD-01"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-rose-500 outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-700 block mb-1 font-medium">Building Type</label>
                  <input
                    type="text"
                    value={formData.building_type}
                    onChange={(e) => setFormData({ ...formData, building_type: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-700 block mb-1 font-medium">Address</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-700 block mb-1 font-medium">Floors Count</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.floors_count}
                    onChange={(e) => setFormData({ ...formData, floors_count: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-700 block mb-1 font-medium">Total Area (m²)</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.total_area_sqm}
                    onChange={(e) => setFormData({ ...formData, total_area_sqm: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 block mb-1 font-medium">Facility Manager (Person Link)</label>
                  <select
                    value={formData.manager_person_id}
                    onChange={(e) => setFormData({ ...formData, manager_person_id: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 outline-none"
                  >
                    <option value="">No manager assigned</option>
                    {people.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.first_name} {p.last_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-slate-700 block mb-1 font-medium">Geographic Location (Place Link)</label>
                  <select
                    value={formData.place_id}
                    onChange={(e) => setFormData({ ...formData, place_id: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 outline-none"
                  >
                    <option value="">No geographic place linked</option>
                    {places.map((pl) => (
                      <option key={pl.id} value={pl.id}>
                        {pl.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

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
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-semibold shadow-xs"
                >
                  Save Building
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
