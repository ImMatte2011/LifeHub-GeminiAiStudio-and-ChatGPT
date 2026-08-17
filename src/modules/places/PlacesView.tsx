import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  Plus,
  Search,
  Filter,
  Navigation,
  Compass,
  Star,
  Layers,
  AlertTriangle,
  Map as MapIcon,
  Trash2,
  X,
  CheckCircle2,
} from 'lucide-react';
import { Place, Tag } from '../../types/index.js';
import { api } from '../../services/api.js';
import { TagPicker } from '../../components/shared/TagPicker.js';

interface PlacesViewProps {
  onSelectEntity: (id: string) => void;
  mapsExtensionActive: boolean;
  onOpenExtensions: () => void;
  openCreateTrigger?: boolean;
  onResetCreateTrigger?: () => void;
}

export const PlacesView: React.FC<PlacesViewProps> = ({
  onSelectEntity,
  mapsExtensionActive,
  onOpenExtensions,
  openCreateTrigger,
  onResetCreateTrigger,
}) => {
  const [places, setPlaces] = useState<Place[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [searchQ, setSearchQ] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [loading, setLoading] = useState(false);

  // PostGIS Radius Search
  const [radiusKm, setRadiusKm] = useState<number>(50);
  const [radiusCenter, setRadiusCenter] = useState<{ lat: number; lng: number }>({
    lat: 41.9028,
    lng: 12.4964,
  }); // Rome center default
  const [radiusActive, setRadiusActive] = useState(false);

  // Create Place Modal
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: 'Cultural',
    address: '',
    latitude: 41.8902,
    longitude: 12.4922,
    description: '',
    opening_hours: '',
    website: '',
    phone: '',
    tags: [] as string[],
  });

  // Leaflet map container ref
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const markersGroupRef = useRef<any>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [resPlaces, tList] = await Promise.all([
        api.places.list(),
        api.shared.getTags(),
      ]);
      setPlaces(resPlaces.places);
      setAllTags(tList);
    } catch (err) {
      console.error('Failed to load places:', err);
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

  // Leaflet Map Initialization & Updates
  useEffect(() => {
    if (!mapsExtensionActive || !mapContainerRef.current) {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
      return;
    }

    const L = (window as any).L;
    if (!L) return;

    if (!leafletMapRef.current) {
      const map = L.map(mapContainerRef.current).setView([41.9028, 12.4964], 12);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      leafletMapRef.current = map;
      markersGroupRef.current = L.layerGroup().addTo(map);

      // Click on map to pick coordinates when modal is open
      map.on('click', (e: any) => {
        setFormData((prev) => ({
          ...prev,
          latitude: Number(e.latlng.lat.toFixed(5)),
          longitude: Number(e.latlng.lng.toFixed(5)),
        }));
      });
    }

    // Refresh markers
    if (markersGroupRef.current && L) {
      markersGroupRef.current.clearLayers();

      const bounds: any[] = [];

      places.forEach((p) => {
        if (p.latitude && p.longitude) {
          const marker = L.marker([p.latitude, p.longitude]);
          marker.bindPopup(`
            <div style="font-family: sans-serif; min-width: 160px;">
              <strong style="font-size: 13px; color: #111;">${p.name}</strong><br/>
              <span style="font-size: 11px; color: #666;">${p.category}</span>
              <p style="font-size: 11px; margin: 4px 0; color: #333;">${p.address || ''}</p>
              <div style="font-size: 10px; color: #4f46e5; font-family: monospace;">GPS: ${p.latitude}, ${p.longitude}</div>
            </div>
          `);
          marker.on('click', () => onSelectEntity(p.id));
          markersGroupRef.current.addLayer(marker);
          bounds.push([p.latitude, p.longitude]);
        }
      });

      if (bounds.length > 0 && leafletMapRef.current) {
        leafletMapRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
      }
    }
  }, [mapsExtensionActive, places]);

  const handlePostGISRadiusSearch = async () => {
    try {
      setLoading(true);
      const data = await api.places.queryRadius(radiusCenter.lat, radiusCenter.lng, radiusKm);
      setPlaces(data.results);
      setRadiusActive(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleResetRadius = () => {
    setRadiusActive(false);
    loadData();
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      await api.places.create(formData);
      setIsCreating(false);
      setFormData({
        name: '',
        category: 'Cultural',
        address: '',
        latitude: 41.8902,
        longitude: 12.4922,
        description: '',
        opening_hours: '',
        website: '',
        phone: '',
        tags: [],
      });
      await loadData();
    } catch (err) {
      console.error('Failed to create place:', err);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this place?')) return;
    try {
      await api.places.delete(id);
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredPlaces = places.filter((p) => {
    const q = searchQ.toLowerCase();
    const matchesSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      (p.address && p.address.toLowerCase().includes(q)) ||
      (p.description && p.description.toLowerCase().includes(q));

    const matchesCat = !categoryFilter || p.category === categoryFilter;
    const matchesTag = !tagFilter || p.tags.some((t) => t.id === tagFilter);

    return matchesSearch && matchesCat && matchesTag;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-amber-600" />
            Places & Spatial Coordinates
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Module <code className="text-blue-600 font-mono">places</code> • Requires extension <code className="text-blue-600 font-mono">maps</code> (PostGIS + Leaflet + OpenStreetMap).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsCreating(true)}
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold flex items-center gap-2 shadow-sm shadow-amber-500/20 transition-all"
          >
            <Plus className="w-4 h-4" /> Add Place
          </button>
        </div>
      </div>

      {/* Extension Fallback Warning Banner if Maps disabled */}
      {!mapsExtensionActive && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start justify-between gap-4 text-xs text-amber-900 shadow-2xs">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold text-amber-950">Extension System Demonstration: `maps` extension is disabled</span>
              <p className="text-amber-800 leading-relaxed">
                Notice how the <strong>Core and Places module continue working perfectly</strong> in graceful fallback mode with raw GPS coordinates and distance calculations. No errors are raised.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenExtensions}
            className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium shrink-0 transition-colors shadow-2xs"
          >
            Enable Maps
          </button>
        </div>
      )}

      {/* Map or PostGIS Spatial Canvas */}
      {mapsExtensionActive ? (
        <div className="space-y-3">
          <div className="h-80 sm:h-96 rounded-2xl overflow-hidden border border-slate-200 shadow-sm relative bg-slate-100">
            <div ref={mapContainerRef} className="w-full h-full z-10" />

            {/* PostGIS Radius Filter Floating Badge */}
            <div className="absolute top-3 right-3 z-20 p-3 rounded-xl bg-white/95 backdrop-blur-md border border-slate-200 shadow-lg text-xs space-y-2 max-w-xs">
              <div className="flex items-center justify-between gap-2 font-mono">
                <span className="text-blue-700 font-semibold flex items-center gap-1">
                  <Compass className="w-3.5 h-3.5 text-blue-600" /> PostGIS ST_DWithin
                </span>
                <span className="text-slate-600 font-semibold">{radiusKm} km radius</span>
              </div>
              <input
                type="range"
                min="5"
                max="500"
                value={radiusKm}
                onChange={(e) => setRadiusKm(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
              <div className="flex justify-between gap-2">
                {radiusActive ? (
                  <button
                    type="button"
                    onClick={handleResetRadius}
                    className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium border border-slate-200"
                  >
                    Reset Filter
                  </button>
                ) : (
                  <span className="text-[10px] text-slate-500">Center: {radiusCenter.lat}, {radiusCenter.lng}</span>
                )}
                <button
                  type="button"
                  onClick={handlePostGISRadiusSearch}
                  className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-[11px] shadow-2xs"
                >
                  Apply Radius
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Filter and Search Bar */}
      <div className="p-3 bg-white border border-slate-200 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs shadow-2xs">
        <div className="flex items-center gap-2 flex-1 min-w-[200px] max-w-md">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search places by name, address, or description..."
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            className="bg-transparent text-slate-900 placeholder:text-slate-400 w-full outline-none text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded text-slate-700 text-xs outline-none focus:border-blue-500"
          >
            <option value="">All Categories</option>
            {['Cultural', 'Home', 'Work', 'Restaurant', 'Outdoors', 'Facility', 'Travel'].map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <select
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
            className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded text-slate-700 text-xs outline-none focus:border-blue-500"
          >
            <option value="">All Tags</option>
            {allTags.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Places Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredPlaces.map((place) => (
          <div
            key={place.id}
            onClick={() => onSelectEntity(place.id)}
            className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 cursor-pointer transition-all hover:scale-[1.01] flex flex-col justify-between space-y-4 group shadow-2xs hover:shadow-md"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center font-bold text-amber-600 text-base shadow-2xs">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-sm text-slate-900 group-hover:text-amber-700 transition-colors">
                        {place.name}
                      </h3>
                      <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-mono bg-slate-100 text-slate-600 border border-slate-200">
                        {place.category}
                      </span>
                    </div>
                    {place.address && (
                      <p className="text-xs text-slate-500 mt-0.5 truncate max-w-[220px]">
                        {place.address}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => handleDelete(e, place.id)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-all"
                  title="Delete place"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {place.description && (
                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {place.description}
                </p>
              )}
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
                <span>GPS: {place.latitude}, {place.longitude}</span>
                {place.distance_km !== undefined && (
                  <span className="text-blue-600 font-semibold">
                    {place.distance_km} km away
                  </span>
                )}
              </div>

              {/* Tags */}
              {place.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {place.tags.map((t) => (
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
                <MapPin className="w-5 h-5 text-amber-600" />
                Add Geographic Place
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
                <div className="sm:col-span-2">
                  <label className="text-slate-700 block mb-1 font-medium">Place Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-700 block mb-1 font-medium">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 outline-none"
                  >
                    {['Cultural', 'Home', 'Work', 'Restaurant', 'Outdoors', 'Facility', 'Travel', 'Other'].map(
                      (cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      )
                    )}
                  </select>
                </div>
                <div>
                  <label className="text-slate-700 block mb-1 font-medium">Address</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-700 block mb-1 font-mono font-medium">Latitude (PostGIS)</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-700 block mb-1 font-mono font-medium">Longitude (PostGIS)</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-medium">Description & Notes</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-amber-500 outline-none resize-none"
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
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-semibold shadow-xs"
                >
                  Save Place
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
