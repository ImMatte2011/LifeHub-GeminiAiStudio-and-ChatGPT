import { Router } from 'express';
import { db } from '../db/database.js';
import { SharedTag, SharedLink } from '../db/types.js';
import { AuthenticatedRequest, requireAuth } from '../middleware/auth.js';

const router = Router();

// Protect all shared routes
router.use(requireAuth);

// Tags CRUD
router.get('/tags', (req, res) => {
  return res.json(Array.from(db.tags.values()));
});

router.post('/tags', (req: AuthenticatedRequest, res) => {
  const { name, color, icon } = req.body;
  if (!name) return res.status(400).json({ error: 'Tag name is required' });

  const id = 'tag_' + name.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const userId = req.userId || 'user_admin';

  const tag: SharedTag = {
    id,
    name,
    color: color || '#3b82f6',
    icon: icon || 'Tag',
  };

  db.tags.set(id, tag);
  db.logAudit(userId, 'CREATE', `Created tag: ${name}`, id, 'tag');
  return res.json(tag);
});

router.delete('/tags/:id', (req: AuthenticatedRequest, res) => {
  const userId = req.userId || 'user_admin';
  db.tags.delete(req.params.id);
  db.entityTags = db.entityTags.filter((et) => et.tag_id !== req.params.id);
  db.logAudit(userId, 'DELETE', `Deleted tag: ${req.params.id}`, req.params.id, 'tag');
  return res.json({ success: true });
});

// Entity Tags
router.get('/entity-tags/:entityId', (req, res) => {
  return res.json(db.getEntityTags(req.params.entityId));
});

router.post('/entity-tags', (req, res) => {
  const { entity_id, tag_id } = req.body;
  if (!entity_id || !tag_id) {
    return res.status(400).json({ error: 'entity_id and tag_id are required' });
  }
  db.addEntityTag(entity_id, tag_id);
  return res.json({ success: true, tags: db.getEntityTags(entity_id) });
});

router.delete('/entity-tags/:entityId/:tagId', (req, res) => {
  db.removeEntityTag(req.params.entityId, req.params.tagId);
  return res.json({ success: true, tags: db.getEntityTags(req.params.entityId) });
});

// Link Types & Links
router.get('/link-types', (req, res) => {
  return res.json(Array.from(db.linkTypes.values()));
});

router.get('/links/:entityId', (req, res) => {
  return res.json(db.getEntityLinks(req.params.entityId));
});

router.post('/links', (req: AuthenticatedRequest, res) => {
  const { source_entity_id, target_entity_id, link_type_id, notes } = req.body;
  if (!source_entity_id || !target_entity_id || !link_type_id) {
    return res.status(400).json({ error: 'source_entity_id, target_entity_id, and link_type_id are required' });
  }

  const userId = req.userId || 'user_admin';
  const link = db.addLink(source_entity_id, target_entity_id, link_type_id, notes);
  db.logAudit(userId, 'CREATE', `Linked entity ${source_entity_id} to ${target_entity_id}`, link.id, 'link');

  return res.json(link);
});

router.delete('/links/:id', (req: AuthenticatedRequest, res) => {
  const userId = req.userId || 'user_admin';
  db.links = db.links.filter((l) => l.id !== req.params.id);
  db.logAudit(userId, 'DELETE', `Removed link ${req.params.id}`, req.params.id, 'link');
  return res.json({ success: true });
});

// Shared Files (Attachment simulation)
router.get('/files', (req, res) => {
  return res.json(Array.from(db.files.values()));
});

router.post('/files', (req, res) => {
  const { filename, file_size, mime_type, file_url, entity_id } = req.body;
  const id = 'file_' + Math.random().toString(36).substring(2, 9);
  const file = {
    id,
    filename: filename || 'attachment.pdf',
    file_size: file_size || 1024 * 250,
    mime_type: mime_type || 'application/pdf',
    file_url: file_url || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400',
    created_at: new Date().toISOString(),
  };

  db.files.set(id, file);

  if (entity_id) {
    db.entityFiles.push({
      id: 'ef_' + Math.random().toString(36).substring(2, 9),
      entity_id,
      file_id: id,
      role: 'attachment',
    });
  }

  return res.json(file);
});

// Helper to map entity_type to module_name
function getModuleNameFromEntityType(entityType: string): string {
  switch (entityType) {
    case 'person':
      return 'people';
    case 'place':
      return 'places';
    case 'event':
      return 'events';
    case 'knowledge_item':
      return 'knowledge';
    case 'building':
      return 'buildings';
    default:
      return 'core';
  }
}

// Universal Relationship Graph
router.get('/graph', (req, res) => {
  const { module_name, tag_id, search } = req.query;

  let entityList = Array.from(db.entities.values());

  if (module_name && module_name !== 'all') {
    entityList = entityList.filter((e) => getModuleNameFromEntityType(e.entity_type) === module_name);
  }

  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    entityList = entityList.filter(
      (e) => e.title.toLowerCase().includes(q) || e.entity_type.toLowerCase().includes(q)
    );
  }

  if (tag_id && typeof tag_id === 'string') {
    entityList = entityList.filter((e) => {
      const tags = db.getEntityTags(e.id);
      return tags.some((t) => t.id === tag_id);
    });
  }

  const validEntityIds = new Set(entityList.map((e) => e.id));

  const nodes = entityList.map((e) => {
    const tags = db.getEntityTags(e.id);
    const connCount = db.links.filter(
      (l) => l.source_entity_id === e.id || l.target_entity_id === e.id
    ).length;

    const mod = getModuleNameFromEntityType(e.entity_type);
    let metaSnippet = '';
    if (mod === 'people') {
      const p = db.people.get(e.id);
      if (p) metaSnippet = p.role_title ? `${p.role_title} at ${p.company || ''}` : p.bio || '';
    } else if (mod === 'places') {
      const p = db.places.get(e.id);
      if (p) metaSnippet = `${p.category} • ${p.address || ''}`;
    } else if (mod === 'events') {
      const ev = db.events.get(e.id);
      if (ev) metaSnippet = ev.description || new Date(ev.start_time).toLocaleDateString();
    } else if (mod === 'knowledge') {
      const k = db.knowledgeItems.get(e.id);
      if (k) metaSnippet = k.description || '';
    } else if (mod === 'buildings') {
      const b = db.buildings.get(e.id);
      if (b) metaSnippet = `${b.building_type} • ${b.code}`;
    }

    return {
      id: e.id,
      title: e.title,
      module_name: mod,
      entity_type: e.entity_type,
      tags,
      metaSnippet,
      connections_count: connCount,
      created_at: e.created_at,
    };
  });

  const edges = db.links
    .filter((l) => validEntityIds.has(l.source_entity_id) && validEntityIds.has(l.target_entity_id))
    .map((l) => {
      const typeInfo = db.linkTypes.get(l.link_type_id);
      return {
        id: l.id,
        source: l.source_entity_id,
        target: l.target_entity_id,
        link_type_id: l.link_type_id,
        label: typeInfo?.forward_label || 'Related to',
        notes: l.notes,
      };
    });

  return res.json({
    nodes,
    edges,
    link_types: Array.from(db.linkTypes.values()),
    tags: Array.from(db.tags.values()),
    total_nodes: nodes.length,
    total_edges: edges.length,
  });
});

// Unified Chronological Timeline Stream
router.get('/timeline', (req, res) => {
  const { limit = 50, module_name } = req.query;

  const timelineItems: Array<{
    id: string;
    entity_id: string;
    module_name: string;
    type: 'event' | 'visit' | 'knowledge' | 'person' | 'building';
    title: string;
    subtitle?: string;
    timestamp: string;
    tags: SharedTag[];
    meta?: Record<string, any>;
  }> = [];

  // 1. Events
  if (!module_name || module_name === 'events' || module_name === 'all') {
    for (const ev of db.events.values()) {
      const place = ev.place_id ? db.places.get(ev.place_id) : null;
      timelineItems.push({
        id: 'tl_ev_' + ev.id,
        entity_id: ev.id,
        module_name: 'events',
        type: 'event',
        title: ev.title,
        subtitle: place ? `Location: ${place.name}` : ev.description,
        timestamp: ev.start_time,
        tags: db.getEntityTags(ev.id),
        meta: {
          start_time: ev.start_time,
          end_time: ev.end_time,
          is_all_day: ev.is_all_day,
        },
      });
    }
  }

  // 2. Visits
  if (!module_name || module_name === 'places' || module_name === 'all') {
    for (const visit of db.visits) {
      const place = db.places.get(visit.place_id);
      timelineItems.push({
        id: 'tl_vis_' + visit.id,
        entity_id: visit.place_id,
        module_name: 'places',
        type: 'visit',
        title: `Visited ${place?.name || 'Place'}`,
        subtitle: visit.notes || place?.address,
        timestamp: visit.visited_at,
        tags: db.getEntityTags(visit.place_id),
        meta: {
          rating: visit.rating,
          place_name: place?.name,
        },
      });
    }
  }

  // 3. Knowledge Items Created
  if (!module_name || module_name === 'knowledge' || module_name === 'all') {
    for (const item of db.knowledgeItems.values()) {
      const entity = db.entities.get(item.id);
      timelineItems.push({
        id: 'tl_kn_' + item.id,
        entity_id: item.id,
        module_name: 'knowledge',
        type: 'knowledge',
        title: `Cataloged ${item.title}`,
        subtitle: item.description,
        timestamp: entity?.created_at || new Date().toISOString(),
        tags: db.getEntityTags(item.id),
        meta: {
          type_id: item.entity_type_id,
        },
      });
    }
  }

  // 4. People Registered / Updated
  if (!module_name || module_name === 'people' || module_name === 'all') {
    for (const p of db.people.values()) {
      const entity = db.entities.get(p.id);
      const personContacts = Array.from(db.contacts.values()).filter((c) => c.person_id === p.id);
      const primaryEmail = personContacts.find((c) => c.type === 'email')?.value;
      timelineItems.push({
        id: 'tl_per_' + p.id,
        entity_id: p.id,
        module_name: 'people',
        type: 'person',
        title: `Connected with ${p.first_name} ${p.last_name}`,
        subtitle: p.company ? `${p.role_title || 'Colleague'} at ${p.company}` : p.bio || p.notes,
        timestamp: entity?.created_at || new Date().toISOString(),
        tags: db.getEntityTags(p.id),
        meta: {
          email: primaryEmail,
          company: p.company,
        },
      });
    }
  }

  // Sort descending by timestamp
  timelineItems.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return res.json(timelineItems.slice(0, Number(limit)));
});

export default router;
