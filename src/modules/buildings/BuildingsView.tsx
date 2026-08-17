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
import { ConfirmDialog } from '../../components/shared/ConfirmDialog.js';
import { useLanguage, TranslatedText } from '../../i18n/LanguageContext.js';

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
  const { language, t } = useLanguage();
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [searchQ, setSearchQ] = useState('');
  const [loading, setLoading] = useState(false);

  // Delete Dialog State
  const [buildingToDelete, setBuildingToDelete] = useState<{ id: string; name: string } | null>(null);

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

  const handleConfirmDelete = async () => {
    if (!buildingToDelete) return;
    const id = buildingToDelete.id;
    try {
      setBuildings((prev) => prev.filter((b) => b.id !== id));
      setBuildingToDelete(null);
      await api.buildings.delete(id);
      await loadData();
    } catch (err) {
      console.error(err);
      await loadData();
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
            {t.buildingsView?.title || (language === 'it' ? 'Edifici & Asset Immobiliari' : 'Buildings & Real Estate Assets')}
            <span className="text-xs px-2 py-0.5 rounded font-mono bg-rose-50 text-rose-700 border border-rose-200">
              {language === 'it' ? 'Modulo Disaccoppiato' : 'Decoupled Module'}
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {language === 'it'
              ? 'Modulo buildings • Collega entità Core, tag condivisi e riferimenti geografici.'
              : 'Demonstrating how domain modules plug into Core entities, shared tags, shared links, and extensions.'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreating(true)}
          className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center gap-2 shadow-sm shadow-rose-500/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />{' '}
          {t.buildingsView?.addBuilding || (language === 'it' ? 'Aggiungi Edificio' : 'Add Building')}
        </button>
      </div>

      {/* Search Bar */}
      <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-3 text-xs shadow-2xs">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder={
              language === 'it'
                ? 'Cerca edificio per nome, codice o tipologia...'
                : 'Search building by name, code, or type...'
            }
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            className="bg-transparent text-slate-900 placeholder:text-slate-400 w-full outline-none text-xs"
          />
        </div>
      </div>

      {/* Buildings Grid */}
      {filteredBuildings.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl space-y-3">
          <Building2 className="w-10 h-10 text-slate-300 mx-auto" />
          <div className="text-sm font-semibold text-slate-700">
            {language === 'it' ? 'Nessun edificio registrato' : 'No buildings found'}
          </div>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {language === 'it'
              ? 'Non ci sono edifici corrispondenti ai criteri di ricerca. Registra una nuova struttura.'
              : 'No buildings match your filter criteria. Register a new real estate asset.'}
          </p>
          <button
            type="button"
            onClick={() => setIsCreating(true)}
            className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            {language === 'it' ? 'Aggiungi Edificio' : 'Add Building'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredBuildings.map((building) => {
            const mgr = people.find((p) => p.id === building.manager_person_id);
            const plc = places.find((p) => p.id === building.place_id);

            return (
              <div
                key={building.id}
                onClick={() => onSelectEntity(building.id)}
                className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 cursor-pointer transition-all hover:scale-[1.01] flex flex-col justify-between space-y-4 group shadow-2xs hover:shadow-md"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shadow-2xs shrink-0">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-sm text-slate-900 group-hover:text-rose-600 transition-colors truncate">
                            {building.name}
                          </h3>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
                            {building.code}
                          </span>
                          <span className="text-xs text-slate-500 truncate">{building.building_type}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setBuildingToDelete({
                          id: building.id,
                          name: building.name,
                        });
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                      title={language === 'it' ? 'Elimina edificio' : 'Delete building'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {building.notes && (
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      <TranslatedText text={building.notes} />
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <div>
                      <span className="text-slate-500">{language === 'it' ? 'Piani:' : 'Floors:'}</span>{' '}
                      <span className="font-semibold text-slate-800">{building.floors_count}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">{language === 'it' ? 'Area:' : 'Area:'}</span>{' '}
                      <span className="font-semibold text-slate-800">{building.total_area_sqm} m²</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
                  {mgr && (
                    <div className="flex items-center gap-1.5 truncate">
                      <User className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span className="text-slate-500">{language === 'it' ? 'Responsabile:' : 'Manager:'}</span>
                      <span className="font-medium text-slate-800 truncate">{mgr.first_name} {mgr.last_name}</span>
                    </div>
                  )}

                  {plc && (
                    <div className="flex items-center gap-1.5 text-amber-700 truncate">
                      <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span className="truncate">{plc.name}</span>
                    </div>
                  )}

                  {/* Tags */}
                  {building.tags && building.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {building.tags.map((t) => (
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
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(buildingToDelete)}
        title={language === 'it' ? 'Elimina Edificio' : 'Delete Building'}
        itemName={buildingToDelete?.name}
        message={
          language === 'it'
            ? 'Sei sicuro di voler eliminare questo edificio? L\'operazione non può essere annullata.'
            : 'Are you sure you want to delete this building? This action cannot be undone.'
        }
        confirmLabel={language === 'it' ? 'Elimina Edificio' : 'Delete Building'}
        cancelLabel={language === 'it' ? 'Annulla' : 'Cancel'}
        onConfirm={handleConfirmDelete}
        onCancel={() => setBuildingToDelete(null)}
      />

      {/* Create Modal */}
      {isCreating && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="w-full max-w-xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-rose-600" />
                {language === 'it' ? 'Registra Nuovo Edificio' : 'Register New Building'}
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
                <div>
                  <label className="text-slate-700 block mb-1 font-medium">
                    {language === 'it' ? 'Nome Edificio *' : 'Building Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-rose-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-700 block mb-1 font-medium">
                    {language === 'it' ? 'Codice Struttura *' : 'Building Code *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BLD-HQ-01"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-rose-500 outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-700 block mb-1 font-medium">
                    {language === 'it' ? 'Tipologia Edificio' : 'Building Type'}
                  </label>
                  <input
                    type="text"
                    value={formData.building_type}
                    onChange={(e) => setFormData({ ...formData, building_type: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-700 block mb-1 font-medium">
                    {language === 'it' ? 'Indirizzo Civico' : 'Address'}
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-700 block mb-1 font-medium">
                    {language === 'it' ? 'Luogo Spaziale Collegato' : 'Linked Place Entity'}
                  </label>
                  <select
                    value={formData.place_id}
                    onChange={(e) => setFormData({ ...formData, place_id: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 outline-none"
                  >
                    <option value="">{language === 'it' ? '-- Nessun luogo --' : '-- No place --'}</option>
                    {places.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-slate-700 block mb-1 font-medium">
                    {language === 'it' ? 'Responsabile / Custode' : 'Assigned Facility Manager'}
                  </label>
                  <select
                    value={formData.manager_person_id}
                    onChange={(e) => setFormData({ ...formData, manager_person_id: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 outline-none"
                  >
                    <option value="">{language === 'it' ? '-- Nessuno --' : '-- None --'}</option>
                    {people.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.first_name} {p.last_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-slate-700 block mb-1 font-medium">
                    {language === 'it' ? 'Numero di Piani' : 'Floors Count'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.floors_count}
                    onChange={(e) => setFormData({ ...formData, floors_count: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-700 block mb-1 font-medium">
                    {language === 'it' ? 'Superficie Totale (m²)' : 'Total Area (sqm)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.total_area_sqm}
                    onChange={(e) => setFormData({ ...formData, total_area_sqm: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-medium">
                  {language === 'it' ? 'Note & Descrizione Struttura' : 'Notes & Facility Description'}
                </label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-rose-500 outline-none resize-none"
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
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-semibold shadow-xs"
                >
                  {language === 'it' ? 'Salva Edificio' : 'Save Building'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
