import React, { useState, useEffect } from 'react';
import {
  X,
  Tag as TagIcon,
  Link2,
  Calendar,
  MapPin,
  User as UserIcon,
  BookOpen,
  Building2,
  ExternalLink,
  Plus,
  Trash2,
  Clock,
  CheckCircle2,
  Layers,
} from 'lucide-react';
import { Tag, LinkType } from '../../types/index.js';
import { api } from '../../services/api.js';
import { TagPicker } from './TagPicker.js';

interface EntityDetailDrawerProps {
  entityId: string | null;
  onClose: () => void;
  onEntityClick?: (id: string) => void;
}

export const EntityDetailDrawer: React.FC<EntityDetailDrawerProps> = ({
  entityId,
  onClose,
  onEntityClick,
}) => {
  const [loading, setLoading] = useState(false);
  const [entityData, setEntityData] = useState<any>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [links, setLinks] = useState<any[]>([]);
  const [linkTypes, setLinkTypes] = useState<LinkType[]>([]);
  const [allEntities, setAllEntities] = useState<{ id: string; title: string; entity_type: string }[]>([]);

  // Link creation state
  const [isLinking, setIsLinking] = useState(false);
  const [targetEntityId, setTargetEntityId] = useState('');
  const [selectedLinkTypeId, setSelectedLinkTypeId] = useState('');
  const [linkNotes, setLinkNotes] = useState('');

  const loadEntity = async () => {
    if (!entityId) return;
    setLoading(true);
    try {
      // Determine entity type by prefix or search
      const [fetchedTags, fetchedAllTags, fetchedLinks, fetchedLinkTypes, searchRes] = await Promise.all([
        api.shared.getEntityTags(entityId),
        api.shared.getTags(),
        api.shared.getEntityLinks(entityId),
        api.shared.getLinkTypes(),
        api.search.query(''),
      ]);

      setTags(fetchedTags);
      setAllTags(fetchedAllTags);
      setLinks(fetchedLinks);
      setLinkTypes(fetchedLinkTypes);
      if (fetchedLinkTypes.length > 0) {
        setSelectedLinkTypeId(fetchedLinkTypes[0].id);
      }

      // Collect all entities for link picker
      setAllEntities(
        searchRes.results
          .filter((r) => r.id !== entityId)
          .map((r) => ({ id: r.id, title: r.title, entity_type: r.entity_type }))
      );

      // Fetch specific domain entity details
      if (entityId.startsWith('person_')) {
        const p = await api.people.get(entityId);
        setEntityData({ ...p, entity_type: 'person' });
      } else if (entityId.startsWith('place_')) {
        const pl = await api.places.get(entityId);
        setEntityData({ ...pl, entity_type: 'place' });
      } else if (entityId.startsWith('event_')) {
        const ev = await api.events.get(entityId);
        setEntityData({ ...ev, entity_type: 'event' });
      } else if (entityId.startsWith('know_')) {
        const kn = await api.knowledge.get(entityId);
        setEntityData({ ...kn, entity_type: 'knowledge_item' });
      } else if (entityId.startsWith('bld_')) {
        const b = await api.buildings.get(entityId);
        setEntityData({ ...b, entity_type: 'building' });
      }
    } catch (err) {
      console.error('Failed to load entity drawer data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEntity();
  }, [entityId]);

  if (!entityId) return null;

  const handleTagsChange = async (newTagIds: string[]) => {
    try {
      const currentIds = tags.map((t) => t.id);
      // Added
      for (const id of newTagIds) {
        if (!currentIds.includes(id)) {
          await api.shared.addEntityTag(entityId, id);
        }
      }
      // Removed
      for (const id of currentIds) {
        if (!newTagIds.includes(id)) {
          await api.shared.removeEntityTag(entityId, id);
        }
      }
      const updated = await api.shared.getEntityTags(entityId);
      setTags(updated);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetEntityId || !selectedLinkTypeId) return;
    try {
      await api.shared.createLink(entityId, targetEntityId, selectedLinkTypeId, linkNotes);
      const updatedLinks = await api.shared.getEntityLinks(entityId);
      setLinks(updatedLinks);
      setIsLinking(false);
      setLinkNotes('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteLink = async (linkId: string) => {
    try {
      await api.shared.deleteLink(linkId);
      setLinks(links.filter((l) => l.id !== linkId));
    } catch (err) {
      console.error(err);
    }
  };

  const getEntityIcon = (type: string) => {
    switch (type) {
      case 'person':
        return <UserIcon className="w-5 h-5 text-blue-600" />;
      case 'place':
        return <MapPin className="w-5 h-5 text-amber-600" />;
      case 'event':
        return <Calendar className="w-5 h-5 text-purple-600" />;
      case 'knowledge_item':
        return <BookOpen className="w-5 h-5 text-emerald-600" />;
      case 'building':
        return <Building2 className="w-5 h-5 text-rose-600" />;
      default:
        return <Layers className="w-5 h-5 text-slate-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-white border-l border-slate-200 shadow-2xl flex flex-col h-full overflow-hidden">
        {/* Drawer Header */}
        <div className="p-4 sm:p-6 border-b border-slate-200 bg-slate-50/70 backdrop-blur flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-white border border-slate-200 shadow-2xs">
              {entityData ? getEntityIcon(entityData.entity_type) : <Layers className="w-5 h-5 text-slate-400" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                  {entityData?.entity_type || 'Entity'}
                </span>
                <span className="text-xs font-mono text-slate-400">{entityId}</span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 mt-1">
                {entityData?.title || entityData?.first_name ? `${entityData.first_name} ${entityData.last_name || ''}` : entityData?.name || 'Entity Details'}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400">
              <Clock className="w-6 h-6 animate-spin mb-2 text-blue-600" />
              <p className="text-sm">Loading entity metadata from Core registry...</p>
            </div>
          ) : entityData ? (
            <>
              {/* Core Entity Info */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span className="font-mono text-slate-400">Universal Pattern:</span>
                  <span className="font-medium text-slate-800">core.entities → shared services</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-mono text-slate-400">Registered ID:</span>
                  <span className="font-mono text-blue-600 font-semibold">{entityId}</span>
                </div>
                {entityData.entity?.created_at && (
                  <div className="flex justify-between">
                    <span className="font-mono text-slate-400">Created At:</span>
                    <span className="text-slate-700">{new Date(entityData.entity.created_at).toLocaleString()}</span>
                  </div>
                )}
              </div>

              {/* Shared Tags Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <TagIcon className="w-3.5 h-3.5 text-blue-600" />
                    Shared Tags (shared.entity_tags)
                  </h3>
                </div>
                <TagPicker
                  allTags={allTags}
                  selectedTagIds={tags.map((t) => t.id)}
                  onChange={handleTagsChange}
                />
              </div>

              {/* Domain Specific Data Card */}
              <div className="p-4 bg-slate-50/50 border border-slate-200 rounded-xl space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Domain Attributes
                </h3>

                {/* Person details */}
                {entityData.entity_type === 'person' && (
                  <div className="space-y-2 text-sm">
                    {entityData.bio && <p className="text-slate-700 text-xs">{entityData.bio}</p>}
                    {entityData.company && (
                      <div className="text-xs text-slate-600">
                        <span className="text-slate-400">Company / Role:</span> {entityData.role_title} @ {entityData.company}
                      </div>
                    )}
                    {entityData.birthdate && (
                      <div className="text-xs text-slate-600">
                        <span className="text-slate-400">Birthdate:</span> {entityData.birthdate}
                      </div>
                    )}
                    {entityData.contacts && entityData.contacts.length > 0 && (
                      <div className="pt-2 border-t border-slate-200">
                        <span className="text-xs font-medium text-slate-700">Contacts:</span>
                        <div className="mt-1 space-y-1">
                          {entityData.contacts.map((c: any) => (
                            <div key={c.id} className="text-xs flex items-center gap-2 text-slate-800 font-mono">
                              <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 text-[10px]">
                                {c.type}
                              </span>
                              <span>{c.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Place details */}
                {entityData.entity_type === 'place' && (
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Category:</span>
                      <span className="font-medium text-slate-800">{entityData.category}</span>
                    </div>
                    {entityData.address && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Address:</span>
                        <span className="text-slate-700 text-right">{entityData.address}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-mono">
                      <span className="text-slate-400">PostGIS Coordinates:</span>
                      <span className="text-blue-600">{entityData.latitude}, {entityData.longitude}</span>
                    </div>
                    {entityData.description && (
                      <p className="text-slate-600 pt-1">{entityData.description}</p>
                    )}
                  </div>
                )}

                {/* Knowledge Item JSONB */}
                {entityData.entity_type === 'knowledge_item' && (
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Meta Type:</span>
                      <span className="font-semibold text-emerald-700">{entityData.meta_type?.name || entityData.entity_type_id}</span>
                    </div>
                    {entityData.description && (
                      <p className="text-slate-600 italic">{entityData.description}</p>
                    )}
                    <div className="pt-2 border-t border-slate-200">
                      <span className="text-[11px] font-mono text-slate-500 uppercase font-semibold">JSONB Properties:</span>
                      <div className="mt-1.5 p-2.5 rounded-lg bg-white border border-slate-200 space-y-1">
                        {entityData.properties && Object.keys(entityData.properties).length > 0 ? (
                          Object.entries(entityData.properties).map(([k, v]) => (
                            <div key={k} className="flex justify-between gap-2 text-xs">
                              <span className="font-mono text-slate-400">{k}:</span>
                              <span className="font-mono text-slate-800 text-right">{String(v)}</span>
                            </div>
                          ))
                        ) : (
                          <span className="text-slate-400 italic">Empty JSONB properties</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Event details */}
                {entityData.entity_type === 'event' && (
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Time:</span>
                      <span className="text-slate-800 font-mono">{entityData.start_time}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Status:</span>
                      <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 font-medium">{entityData.status}</span>
                    </div>
                    {entityData.description && <p className="text-slate-600 pt-1">{entityData.description}</p>}
                  </div>
                )}
              </div>

              {/* Shared Cross-Entity Links (shared.links) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Link2 className="w-3.5 h-3.5 text-blue-600" />
                    Cross-Entity Links (shared.links)
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsLinking(!isLinking)}
                    className="text-xs px-2.5 py-1 rounded-lg bg-white hover:bg-slate-50 text-blue-600 border border-slate-200 flex items-center gap-1 transition-colors shadow-2xs font-medium"
                  >
                    <Plus className="w-3 h-3" /> Connect Entity
                  </button>
                </div>

                {isLinking && (
                  <form onSubmit={handleCreateLink} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                    <div className="font-semibold text-slate-900">Connect to another entity</div>
                    <div>
                      <label className="text-slate-600 block mb-1 font-medium">Relationship Type</label>
                      <select
                        value={selectedLinkTypeId}
                        onChange={(e) => setSelectedLinkTypeId(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 outline-none"
                      >
                        {linkTypes.map((lt) => (
                          <option key={lt.id} value={lt.id}>
                            {lt.forward_label} ({lt.code})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-slate-600 block mb-1 font-medium">Target Entity</label>
                      <select
                        value={targetEntityId}
                        onChange={(e) => setTargetEntityId(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 outline-none"
                      >
                        <option value="">Select an entity...</option>
                        {allEntities.map((e) => (
                          <option key={e.id} value={e.id}>
                            [{e.entity_type}] {e.title}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <input
                        type="text"
                        placeholder="Optional relation notes..."
                        value={linkNotes}
                        onChange={(e) => setLinkNotes(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 outline-none"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsLinking(false)}
                        className="px-2.5 py-1 text-slate-500 hover:text-slate-800"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={!targetEntityId || !selectedLinkTypeId}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-2xs disabled:opacity-50"
                      >
                        Save Connection
                      </button>
                    </div>
                  </form>
                )}

                {links.length === 0 ? (
                  <div className="p-4 text-center rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-400">
                    No cross-entity links recorded yet.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {links.map((l) => (
                      <div
                        key={l.id}
                        className="p-3 bg-white border border-slate-200 hover:border-slate-300 rounded-xl flex items-center justify-between text-xs transition-colors shadow-2xs"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-blue-600">
                              {l.direction === 'outgoing' ? l.link_type?.forward_label : l.link_type?.reverse_label || 'Linked with'}:
                            </span>
                            <button
                              type="button"
                              onClick={() => onEntityClick && onEntityClick(l.target_entity?.id || (l.direction === 'outgoing' ? l.target_entity_id : l.source_entity_id))}
                              className="font-medium text-slate-800 hover:text-blue-600 underline decoration-slate-300 underline-offset-2 flex items-center gap-1"
                            >
                              {l.target_entity?.title || 'Entity'}
                              <ExternalLink className="w-3 h-3 text-slate-400" />
                            </button>
                          </div>
                          {l.notes && <p className="text-slate-500 text-[11px]">{l.notes}</p>}
                        </div>
                        <button
                          onClick={() => handleDeleteLink(l.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                          title="Remove connection"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-slate-400 text-sm">Entity not found.</div>
          )}
        </div>
      </div>
    </div>
  );
};
