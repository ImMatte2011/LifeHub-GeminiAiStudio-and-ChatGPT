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
import { ConfirmDialog } from '../../components/shared/ConfirmDialog.js';
import { useLanguage, TranslatedText } from '../../i18n/LanguageContext.js';

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
  const { language, t } = useLanguage();
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

  // Delete Dialog State
  const [placeToDelete, setPlaceToDelete] = useState<{ id: string; name: string } | null>(null);

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

  const loadData = async () => {
    setLoading(true);
    try {
      if (radiusActive && mapsExtensionActive) {
        const radiusRes = await api.places.queryRadius(
          radiusCenter.lat,
          radiusCenter.lng,
          radiusKm
        );
        setPlaces(radiusRes.results);
      } else {
        const res = await api.places.list();
        setPlaces(res.places);
      }
      const tList = await api.shared.getTags();
      setAllTags(tList);
    } catch (err) {
      console.error('Failed to load places:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [radiusActive, radiusKm, radiusCenter]);

  useEffect(() => {
    if (openCreateTrigger) {
      setIsCreating(true);
      if (onResetCreateTrigger) onResetCreateTrigger();
    }
  }, [openCreateTrigger]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      await api.places.create({
        name: formData.name,
        category: formData.category,
        address: formData.address,
        latitude: formData.latitude,
        longitude: formData.longitude,
        description: formData.description,
        opening_hours: formData.opening_hours,
        website: formData.website,
        phone: formData.phone,
        tags: formData.tags,
      });

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

  const handleConfirmDelete = async () => {
    if (!placeToDelete) return;
    const id = placeToDelete.id;
    try {
      setPlaces((prev) => prev.filter((p) => p.id !== id));
      setPlaceToDelete(null);
      await api.places.delete(id);
      await loadData();
    } catch (err) {
      console.error('Failed to delete place:', err);
      await loadData();
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
            {t.placesView?.title || (language === 'it' ? 'Luoghi & Coordinate Spaziali' : 'Places & Spatial Coordinates')}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {language === 'it'
              ? 'Modulo places • Integrazione estensione maps (PostGIS + OpenStreetMap).'
              : 'Module places • Requires extension maps (PostGIS + Leaflet + OpenStreetMap).'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsCreating(true)}
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold flex items-center gap-2 shadow-sm shadow-amber-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />{' '}
            {t.placesView?.addPlace || (language === 'it' ? 'Aggiungi Luogo' : 'Add Place')}
          </button>
        </div>
      </div>

      {/* Extension Fallback Warning Banner if Maps disabled */}
      {!mapsExtensionActive && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start justify-between gap-4 text-xs text-amber-900 shadow-2xs">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold text-amber-950">
                {language === 'it'
                  ? 'Estensione maps non attiva: Visualizzazione Coordinate Base'
                  : 'Extension maps is disabled: Basic Coordinate Mode'}
              </span>
              <p className="text-amber-800 text-[11px] leading-relaxed">
                {language === 'it'
                  ? 'La mappa cartografica interattiva e le query spaziali PostGIS (ST_DWithin) sono disattivate. Puoi attivare l\'estensione maps in qualsiasi momento dal menu Impostazioni.'
                  : 'Interactive cartography and PostGIS spatial queries (ST_DWithin) are disabled. You can activate the maps extension anytime from Settings.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenExtensions}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold shrink-0 transition-colors shadow-2xs text-[11px]"
          >
            {language === 'it' ? 'Abilita Mappe' : 'Enable Maps'}
          </button>
        </div>
      )}

      {/* Filter and Spatial Controls */}
      <div className="p-3 bg-white border border-slate-200 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs shadow-2xs">
        <div className="flex items-center gap-2 flex-1 min-w-[200px] max-w-md">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder={
              language === 'it'
                ? 'Cerca per nome luogo, indirizzo, note...'
                : 'Search by place name, address, description...'
            }
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            className="bg-transparent text-slate-900 placeholder:text-slate-400 w-full outline-none text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* PostGIS Radius Toggle */}
          {mapsExtensionActive && (
            <button
              type="button"
              onClick={() => setRadiusActive(!radiusActive)}
              className={`px-3 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                radiusActive
                  ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-2xs'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              {radiusActive ? `PostGIS: < ${radiusKm}km` : 'Filtro Raggio (PostGIS)'}
            </button>
          )}

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded text-slate-700 text-xs outline-none"
          >
            <option value="">{language === 'it' ? 'Tutte le Categorie' : 'All Categories'}</option>
            {['Cultural', 'Home', 'Work', 'Restaurant', 'Outdoors', 'Facility', 'Travel', 'Other'].map(
              (cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              )
            )}
          </select>

          <select
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
            className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded text-slate-700 text-xs outline-none"
          >
            <option value="">{language === 'it' ? 'Tutti i Tag' : 'All Tags'}</option>
            {allTags.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Places Grid */}
      {filteredPlaces.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl space-y-3">
          <MapPin className="w-10 h-10 text-slate-300 mx-auto" />
          <div className="text-sm font-semibold text-slate-700">
            {language === 'it' ? 'Nessun luogo trovato' : 'No places found'}
          </div>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {language === 'it'
              ? 'Nessun luogo corrisponde ai criteri di ricerca. Aggiungi un nuovo punto geografico.'
              : 'No places match your filter criteria. Add a new geographic location.'}
          </p>
          <button
            type="button"
            onClick={() => setIsCreating(true)}
            className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            {language === 'it' ? 'Aggiungi Luogo' : 'Add Place'}
          </button>
        </div>
      ) : (
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
                    <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shadow-2xs shrink-0">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-sm text-slate-900 group-hover:text-amber-600 transition-colors truncate">
                        {place.name}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">
                        {place.category} {place.address && `• ${place.address}`}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPlaceToDelete({
                        id: place.id,
                        name: place.name,
                      });
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                    title={language === 'it' ? 'Elimina luogo' : 'Delete place'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {place.description && (
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    <TranslatedText text={place.description} />
                  </p>
                )}
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
                  <span>GPS: {place.latitude}, {place.longitude}</span>
                  {place.distance_km !== undefined && (
                    <span className="text-blue-600 font-semibold">
                      {place.distance_km} km
                    </span>
                  )}
                </div>

                {/* Tags */}
                {place.tags && place.tags.length > 0 && (
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
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(placeToDelete)}
        title={language === 'it' ? 'Elimina Luogo' : 'Delete Place'}
        itemName={placeToDelete?.name}
        message={
          language === 'it'
            ? 'Sei sicuro di voler eliminare questo luogo? Verranno rimossi anche i metadati geografici associati.'
            : 'Are you sure you want to delete this place? Associated geographic metadata will also be removed.'
        }
        confirmLabel={language === 'it' ? 'Elimina Luogo' : 'Delete Place'}
        cancelLabel={language === 'it' ? 'Annulla' : 'Cancel'}
        onConfirm={handleConfirmDelete}
        onCancel={() => setPlaceToDelete(null)}
      />

      {/* Create Modal */}
      {isCreating && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="w-full max-w-xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-amber-600" />
                {language === 'it' ? 'Aggiungi Luogo Geografico' : 'Add Geographic Place'}
              </h2>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-4 sm:p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-slate-700 block mb-1 font-medium">
                    {language === 'it' ? 'Nome Luogo *' : 'Place Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-700 block mb-1 font-medium">
                    {language === 'it' ? 'Categoria' : 'Category'}
                  </label>
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
                  <label className="text-slate-700 block mb-1 font-medium">
                    {language === 'it' ? 'Indirizzo Civico' : 'Address'}
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-700 block mb-1 font-mono font-medium">
                    Latitudine (GPS / PostGIS)
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-700 block mb-1 font-mono font-medium">
                    Longitudine (GPS / PostGIS)
                  </label>
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
                <label className="text-slate-700 block mb-1 font-medium">
                  {language === 'it' ? 'Descrizione & Note' : 'Description & Notes'}
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-amber-500 outline-none resize-none"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="text-slate-700 block mb-1 font-medium">
                  {language === 'it' ? 'Assegna Tag' : 'Assign Tags'}
                </label>
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
                  {language === 'it' ? 'Annulla' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-semibold shadow-xs"
                >
                  {language === 'it' ? 'Salva Luogo' : 'Save Place'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
