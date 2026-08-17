import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  Layers,
  Settings,
  Sparkles,
  Tag as TagIcon,
  Trash2,
  X,
  CheckCircle2,
  Sliders,
  Code,
} from 'lucide-react';
import { Knowledge, MetaType, PropertyDefinition, Tag } from '../../types/index.js';
import { api } from '../../services/api.js';
import { TagPicker } from '../../components/shared/TagPicker.js';
import { ConfirmDialog } from '../../components/shared/ConfirmDialog.js';
import { useLanguage, TranslatedText } from '../../i18n/LanguageContext.js';

interface KnowledgeViewProps {
  onSelectEntity: (id: string) => void;
  openCreateTrigger?: boolean;
  onResetCreateTrigger?: () => void;
}

export const KnowledgeView: React.FC<KnowledgeViewProps> = ({
  onSelectEntity,
  openCreateTrigger,
  onResetCreateTrigger,
}) => {
  const { language, t } = useLanguage();
  const [items, setItems] = useState<Knowledge[]>([]);
  const [metaTypes, setMetaTypes] = useState<MetaType[]>([]);
  const [propertyDefs, setPropertyDefs] = useState<PropertyDefinition[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [selectedTypeId, setSelectedTypeId] = useState<string>('');
  const [selectedTagFilter, setSelectedTagFilter] = useState('');
  const [searchQ, setSearchQ] = useState('');
  const [loading, setLoading] = useState(false);

  // Delete Dialog State
  const [itemToDelete, setItemToDelete] = useState<{ id: string; name: string } | null>(null);

  // Meta Schema Manager Modal
  const [isManagingSchema, setIsManagingSchema] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeCode, setNewTypeCode] = useState('');
  const [newTypeIcon, setNewTypeIcon] = useState('BookOpen');
  const [newTypeDesc, setNewTypeDesc] = useState('');

  // Add Property Definition to active schema
  const [newPropCode, setNewPropCode] = useState('');
  const [newPropLabel, setNewPropLabel] = useState('');
  const [newPropType, setNewPropType] = useState<PropertyDefinition['data_type']>('string');
  const [newPropEnum, setNewPropEnum] = useState('');
  const [newPropRequired, setNewPropRequired] = useState(false);

  // Create Knowledge Item Modal
  const [isCreatingItem, setIsCreatingItem] = useState(false);
  const [newItemTypeId, setNewItemTypeId] = useState('');
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemNotes, setNewItemNotes] = useState('');
  const [newItemProps, setNewItemProps] = useState<Record<string, any>>({});
  const [newItemTags, setNewItemTags] = useState<string[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [kList, mTypes, pDefs, tList] = await Promise.all([
        api.knowledge.list({ entity_type_id: selectedTypeId || undefined }),
        api.meta.getEntityTypes(),
        api.meta.getPropertyDefinitions(selectedTypeId || undefined),
        api.shared.getTags(),
      ]);
      setItems(kList);
      setMetaTypes(mTypes);
      setPropertyDefs(pDefs);
      setAllTags(tList);
      if (!newItemTypeId && mTypes.length > 0) {
        setNewItemTypeId(mTypes[0].id);
      }
    } catch (err) {
      console.error('Failed to load knowledge:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedTypeId]);

  useEffect(() => {
    if (openCreateTrigger) {
      setIsCreatingItem(true);
      if (onResetCreateTrigger) onResetCreateTrigger();
    }
  }, [openCreateTrigger]);

  const handleCreateEntityType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTypeName || !newTypeCode) return;
    try {
      await api.meta.createEntityType({
        name: newTypeName,
        code: newTypeCode.toLowerCase(),
        icon: newTypeIcon,
        description: newTypeDesc,
      });
      setNewTypeName('');
      setNewTypeCode('');
      setNewTypeDesc('');
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddPropertyDefinition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTypeId || !newPropCode || !newPropLabel) return;
    try {
      const enumValues = newPropEnum ? newPropEnum.split(',').map((s) => s.trim()) : undefined;
      await api.meta.createPropertyDefinition({
        entity_type_id: selectedTypeId,
        code: newPropCode.toLowerCase(),
        label: newPropLabel,
        data_type: newPropType,
        enum_values: enumValues,
        is_required: newPropRequired,
      });
      setNewPropCode('');
      setNewPropLabel('');
      setNewPropEnum('');
      setNewPropRequired(false);
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePropertyDef = async (id: string) => {
    try {
      await api.meta.deletePropertyDefinition(id);
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors([]);
    try {
      await api.knowledge.create({
        entity_type_id: newItemTypeId,
        title: newItemTitle,
        description: newItemDesc,
        notes: newItemNotes,
        properties: newItemProps,
        tags: newItemTags,
      });

      setIsCreatingItem(false);
      setNewItemTitle('');
      setNewItemDesc('');
      setNewItemNotes('');
      setNewItemProps({});
      setNewItemTags([]);
      await loadData();
    } catch (err: any) {
      setValidationErrors([err.message]);
    }
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    const id = itemToDelete.id;
    try {
      setItems((prev) => prev.filter((it) => it.id !== id));
      setItemToDelete(null);
      await api.knowledge.delete(id);
      await loadData();
    } catch (err) {
      console.error('Failed to delete knowledge item:', err);
      await loadData();
    }
  };

  const filteredItems = items.filter((item) => {
    const q = searchQ.toLowerCase();
    const matchesSearch =
      !q ||
      item.title.toLowerCase().includes(q) ||
      (item.description && item.description.toLowerCase().includes(q)) ||
      JSON.stringify(item.properties).toLowerCase().includes(q);

    const matchesTag = !selectedTagFilter || item.tags.some((t) => t.id === selectedTagFilter);
    return matchesSearch && matchesTag;
  });

  const activeTypeSchemaProps = propertyDefs.filter(
    (p) => p.entity_type_id === (isCreatingItem ? newItemTypeId : selectedTypeId)
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-600" />
            Meta Layer & Dynamic Knowledge Base
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Module <code className="text-blue-600 font-mono">knowledge</code> • Dynamic Meta schemas without SQL migrations. JSONB storage validated by <code className="text-blue-600 font-mono">meta.property_definitions</code>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsManagingSchema(true)}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 border border-slate-200 shadow-2xs transition-colors"
          >
            <Sliders className="w-4 h-4 text-blue-600" /> Meta Schemas
          </button>
          <button
            type="button"
            onClick={() => setIsCreatingItem(true)}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-2 shadow-sm shadow-emerald-500/20 transition-all"
          >
            <Plus className="w-4 h-4" /> Add Item
          </button>
        </div>
      </div>

      {/* Meta Types Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <button
          type="button"
          onClick={() => setSelectedTypeId('')}
          className={`px-3.5 py-1.5 rounded-xl font-semibold transition-all shrink-0 ${
            selectedTypeId === ''
              ? 'bg-emerald-600 text-white shadow-2xs'
              : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          All Meta Types
        </button>

        {metaTypes.map((mt) => (
          <button
            key={mt.id}
            type="button"
            onClick={() => setSelectedTypeId(mt.id)}
            className={`px-3.5 py-1.5 rounded-xl font-semibold transition-all shrink-0 flex items-center gap-2 ${
              selectedTypeId === mt.id
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <span>{mt.name}</span>
            <span className="text-[10px] font-mono opacity-70">({mt.code})</span>
          </button>
        ))}
      </div>

      {/* Search and Tag filter */}
      <div className="p-3 bg-white border border-slate-200 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs shadow-2xs">
        <div className="flex items-center gap-2 flex-1 min-w-[200px] max-w-md">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search knowledge items, notes, or JSONB values..."
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            className="bg-transparent text-slate-900 placeholder:text-slate-400 w-full outline-none text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={selectedTagFilter}
            onChange={(e) => setSelectedTagFilter(e.target.value)}
            className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded text-slate-700 text-xs outline-none focus:border-emerald-500"
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

      {/* Knowledge Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredItems.map((item) => {
          const mType = metaTypes.find((t) => t.id === item.entity_type_id);
          return (
            <div
              key={item.id}
              onClick={() => onSelectEntity(item.id)}
              className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 cursor-pointer transition-all hover:scale-[1.01] flex flex-col justify-between space-y-4 group shadow-2xs hover:shadow-md"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center font-bold text-emerald-600 text-base shadow-2xs">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm text-slate-900 group-hover:text-emerald-700 transition-colors">
                          {item.title}
                        </h3>
                      </div>
                      <span className="text-[10px] uppercase font-mono font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                        {mType?.name || item.entity_type_id}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setItemToDelete({
                        id: item.id,
                        name: item.title,
                      });
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                    title={language === 'it' ? 'Elimina elemento' : 'Delete item'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {item.description && (
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    <TranslatedText text={item.description} />
                  </p>
                )}

                {/* Dynamic Properties Pill Preview */}
                {item.properties && Object.keys(item.properties).length > 0 && (
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-[11px] font-mono">
                    {Object.entries(item.properties)
                      .slice(0, 3)
                      .map(([key, val]) => (
                        <div key={key} className="flex justify-between gap-2">
                          <span className="text-slate-500">{key}:</span>
                          <span className="text-slate-800 truncate text-right font-medium">{String(val)}</span>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Tags */}
              {item.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-2 border-t border-slate-100">
                  {item.tags.map((t) => (
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
          );
        })}
      </div>

      {/* Meta Schema Manager Modal */}
      {isManagingSchema && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-150">
          <div className="w-full max-w-3xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 sm:p-6 border-b border-slate-200 flex items-start justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600">
                  <Sliders className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    Meta Schema Designer
                    <span className="text-xs px-2 py-0.5 rounded font-mono bg-emerald-50 text-emerald-700 border border-emerald-200">
                      meta.entity_types & meta.property_definitions
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Define new domain object schemas dynamically without altering database tables or running migrations.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsManagingSchema(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              {/* Add New Meta Entity Type */}
              <form onSubmit={handleCreateEntityType} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="font-semibold text-slate-900 flex items-center gap-2">
                  <Plus className="w-4 h-4 text-emerald-600" /> Create New Meta Entity Type
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-slate-700 block mb-1 font-medium">Display Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Wine Bottles, Ammo, Hardware"
                      value={newTypeName}
                      onChange={(e) => setNewTypeName(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 focus:border-emerald-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-slate-700 block mb-1 font-mono font-medium">Code Identifier *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. wine_bottle"
                      value={newTypeCode}
                      onChange={(e) => setNewTypeCode(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 font-mono focus:border-emerald-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-slate-700 block mb-1 font-medium">Description</label>
                    <input
                      type="text"
                      placeholder="Brief purpose..."
                      value={newTypeDesc}
                      onChange={(e) => setNewTypeDesc(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 focus:border-emerald-500 outline-none"
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold shadow-2xs"
                  >
                    Add Entity Type
                  </button>
                </div>
              </form>

              {/* Property Definitions for selected type */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-slate-900 flex items-center gap-2">
                    <Code className="w-4 h-4 text-blue-600" /> Property Definitions for Schema
                  </div>
                  <select
                    value={selectedTypeId}
                    onChange={(e) => setSelectedTypeId(e.target.value)}
                    className="px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs outline-none"
                  >
                    {metaTypes.map((mt) => (
                      <option key={mt.id} value={mt.id}>
                        {mt.name} ({mt.code})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Form to add property */}
                {selectedTypeId && (
                  <form onSubmit={handleAddPropertyDefinition} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="text-[11px] font-mono text-slate-500 uppercase font-semibold">Add Field to {metaTypes.find((t) => t.id === selectedTypeId)?.name}</div>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                      <div>
                        <input
                          type="text"
                          required
                          placeholder="field_key (code)"
                          value={newPropCode}
                          onChange={(e) => setNewPropCode(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 font-mono focus:border-emerald-500 outline-none"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          required
                          placeholder="Field Label"
                          value={newPropLabel}
                          onChange={(e) => setNewPropLabel(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 focus:border-emerald-500 outline-none"
                        />
                      </div>
                      <div>
                        <select
                          value={newPropType}
                          onChange={(e) => setNewPropType(e.target.value as any)}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 outline-none"
                        >
                          <option value="string">string</option>
                          <option value="number">number</option>
                          <option value="boolean">boolean</option>
                          <option value="date">date</option>
                          <option value="select">select (enum)</option>
                          <option value="textarea">textarea</option>
                        </select>
                      </div>
                      <div>
                        <input
                          type="text"
                          placeholder="Enum options (a,b,c)"
                          value={newPropEnum}
                          onChange={(e) => setNewPropEnum(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 text-[11px] focus:border-emerald-500 outline-none"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <label className="flex items-center gap-1.5 text-slate-600 font-medium">
                        <input
                          type="checkbox"
                          checked={newPropRequired}
                          onChange={(e) => setNewPropRequired(e.target.checked)}
                          className="rounded accent-emerald-600"
                        />
                        Required Field
                      </label>
                      <button
                        type="submit"
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-2xs"
                      >
                        Add Property Field
                      </button>
                    </div>
                  </form>
                )}

                {/* Existing property list */}
                <div className="space-y-1.5">
                  {activeTypeSchemaProps.map((prop) => (
                    <div
                      key={prop.id}
                      className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs font-mono"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-slate-800">{prop.label}</span>
                        <span className="text-slate-500 font-normal">({prop.code})</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-50 text-blue-700 border border-blue-200">
                          {prop.data_type}
                        </span>
                        {prop.is_required && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-50 text-rose-700 border border-rose-200">
                            required
                          </span>
                        )}
                        {prop.enum_values && (
                          <span className="text-slate-500 text-[10px]">
                            [{prop.enum_values.join(', ')}]
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeletePropertyDef(prop.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setIsManagingSchema(false)}
                className="px-4 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-medium"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Knowledge Item Modal */}
      {isCreatingItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="w-full max-w-xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-4 sm:p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-600" />
                Add Knowledge Item
              </h2>
              <button
                onClick={() => setIsCreatingItem(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateItem} className="p-4 sm:p-6 space-y-4 text-xs overflow-y-auto flex-1">
              {validationErrors.length > 0 && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
                  {validationErrors.map((err, i) => (
                    <div key={i}>{err}</div>
                  ))}
                </div>
              )}

              <div>
                <label className="text-slate-700 block mb-1 font-medium">Meta Schema Type *</label>
                <select
                  value={newItemTypeId}
                  onChange={(e) => {
                    setNewItemTypeId(e.target.value);
                    setNewItemProps({});
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 outline-none"
                >
                  {metaTypes.map((mt) => (
                    <option key={mt.id} value={mt.id}>
                      {mt.name} ({mt.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-medium">Item Title *</label>
                <input
                  type="text"
                  required
                  value={newItemTitle}
                  onChange={(e) => setNewItemTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-medium">Short Description</label>
                <input
                  type="text"
                  value={newItemDesc}
                  onChange={(e) => setNewItemDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-emerald-500 outline-none"
                />
              </div>

              {/* Dynamic Property Inputs Generated by Meta Layer! */}
              {activeTypeSchemaProps.length > 0 && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="font-semibold text-emerald-700 flex items-center justify-between text-xs">
                    <span>Meta Layer Attributes (JSONB)</span>
                    <span className="font-mono text-slate-400 text-[10px]">Auto-Generated UI Form</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {activeTypeSchemaProps.map((prop) => (
                      <div key={prop.id} className={prop.data_type === 'textarea' ? 'sm:col-span-2' : ''}>
                        <label className="text-slate-700 block mb-1 font-mono font-medium">
                          {prop.label} {prop.is_required && <span className="text-rose-600">*</span>}
                        </label>

                        {prop.data_type === 'select' ? (
                          <select
                            required={prop.is_required}
                            value={newItemProps[prop.code] || ''}
                            onChange={(e) =>
                              setNewItemProps({ ...newItemProps, [prop.code]: e.target.value })
                            }
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 outline-none"
                          >
                            <option value="">Select option...</option>
                            {prop.enum_values?.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        ) : prop.data_type === 'number' ? (
                          <input
                            type="number"
                            required={prop.is_required}
                            value={newItemProps[prop.code] || ''}
                            onChange={(e) =>
                              setNewItemProps({
                                ...newItemProps,
                                [prop.code]: e.target.value ? Number(e.target.value) : undefined,
                              })
                            }
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 font-mono focus:border-emerald-500 outline-none"
                          />
                        ) : prop.data_type === 'boolean' ? (
                          <label className="flex items-center gap-2 pt-2 text-slate-700 font-medium">
                            <input
                              type="checkbox"
                              checked={Boolean(newItemProps[prop.code])}
                              onChange={(e) =>
                                setNewItemProps({ ...newItemProps, [prop.code]: e.target.checked })
                              }
                              className="rounded accent-emerald-600"
                            />
                            True / Enabled
                          </label>
                        ) : prop.data_type === 'date' ? (
                          <input
                            type="date"
                            required={prop.is_required}
                            value={newItemProps[prop.code] || ''}
                            onChange={(e) =>
                              setNewItemProps({ ...newItemProps, [prop.code]: e.target.value })
                            }
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 font-mono focus:border-emerald-500 outline-none"
                          />
                        ) : (
                          <input
                            type="text"
                            required={prop.is_required}
                            value={newItemProps[prop.code] || ''}
                            onChange={(e) =>
                              setNewItemProps({ ...newItemProps, [prop.code]: e.target.value })
                            }
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 focus:border-emerald-500 outline-none"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags */}
              <div>
                <label className="text-slate-700 block mb-1 font-medium">Assign Tags</label>
                <TagPicker
                  allTags={allTags}
                  selectedTagIds={newItemTags}
                  onChange={(tags) => setNewItemTags(tags)}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 bg-slate-50 -mx-4 -mb-4 sm:-mx-6 sm:-mb-6 p-4 sm:p-6">
                <button
                  type="button"
                  onClick={() => setIsCreatingItem(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 font-medium"
                >
                  {language === 'it' ? 'Annulla' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-xs"
                >
                  {language === 'it' ? 'Salva Elemento' : 'Save Knowledge Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(itemToDelete)}
        title={language === 'it' ? 'Elimina Elemento Knowledge' : 'Delete Knowledge Item'}
        itemName={itemToDelete?.name}
        message={
          language === 'it'
            ? 'Sei sicuro di voler eliminare questo elemento dalla knowledge base?'
            : 'Are you sure you want to delete this item from the knowledge base?'
        }
        confirmLabel={language === 'it' ? 'Elimina Elemento' : 'Delete Item'}
        cancelLabel={language === 'it' ? 'Annulla' : 'Cancel'}
        onConfirm={handleConfirmDelete}
        onCancel={() => setItemToDelete(null)}
      />
    </div>
  );
};
