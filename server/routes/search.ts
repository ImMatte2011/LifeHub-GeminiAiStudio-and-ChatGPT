import { Router } from 'express';
import { db, calculateSimilarity } from '../db/database.js';
import { ExtensionManager } from '../services/extensionManager.js';
import { AuthenticatedRequest, requireAuth } from '../middleware/auth.js';

const router = Router();

export interface SearchResultItem {
  id: string;
  module: 'people' | 'places' | 'events' | 'knowledge' | 'buildings';
  entity_type: string;
  title: string;
  subtitle?: string;
  preview: string;
  tags: { id: string; name: string; color: string }[];
  score: number; // 0 to 1
  match_type: 'exact' | 'prefix' | 'trigram_fuzzy' | 'tag_match' | 'fts';
  metadata?: Record<string, any>;
}

// Global Search API (/api/search?q=arch&module=knowledge&tag=tag_tech)
router.get('/', requireAuth, (req: AuthenticatedRequest, res) => {
  const q = String(req.query.q || '').trim();
  const targetModule = req.query.module ? String(req.query.module) : undefined;
  const targetTag = req.query.tag ? String(req.query.tag) : undefined;
  const isTrgmActive = ExtensionManager.isExtensionAvailable('pg_trgm');

  if (!q && !targetTag && !targetModule) {
    // Return recent entities
    const recentEntities = Array.from(db.entities.values())
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, 10)
      .map((e) => {
        const tags = db.getEntityTags(e.id);
        let moduleType: any = 'knowledge';
        let preview = '';
        if (e.entity_type === 'person') {
          moduleType = 'people';
          const p = db.people.get(e.id);
          preview = p?.bio || p?.company || '';
        } else if (e.entity_type === 'place') {
          moduleType = 'places';
          const pl = db.places.get(e.id);
          preview = pl?.address || pl?.description || '';
        } else if (e.entity_type === 'event') {
          moduleType = 'events';
          const ev = db.events.get(e.id);
          preview = `${ev?.start_time?.slice(0, 10)} - ${ev?.description || ''}`;
        } else if (e.entity_type === 'knowledge_item') {
          moduleType = 'knowledge';
          const kn = db.knowledgeItems.get(e.id);
          preview = kn?.description || '';
        } else if (e.entity_type === 'building') {
          moduleType = 'buildings';
          const b = db.buildings.get(e.id);
          preview = `${b?.building_type} - ${b?.address || ''}`;
        }

        return {
          id: e.id,
          module: moduleType,
          entity_type: e.entity_type,
          title: e.title,
          preview,
          tags: tags.map((t) => ({ id: t.id, name: t.name, color: t.color })),
          score: 1.0,
          match_type: 'exact' as const,
        };
      });

    return res.json({
      query: '',
      total: recentEntities.length,
      pg_trgm_enabled: isTrgmActive,
      results: recentEntities,
    });
  }

  const results: SearchResultItem[] = [];
  const lowerQ = q.toLowerCase();

  // 1. Search People (if enabled and matching module filter)
  if (!targetModule || targetModule === 'people') {
    for (const p of db.people.values()) {
      const tags = db.getEntityTags(p.id);
      if (targetTag && !tags.some((t) => t.id === targetTag)) continue;

      const searchableText = `${p.first_name} ${p.last_name} ${p.nickname || ''} ${p.company || ''} ${p.role_title || ''} ${p.bio || ''} ${p.notes || ''}`.toLowerCase();
      let score = 0;
      let matchType: SearchResultItem['match_type'] = 'fts';

      if (!q) {
        score = 1.0;
      } else if (searchableText.includes(lowerQ)) {
        score = lowerQ.length / (p.first_name.length + p.last_name.length + 2) + 0.5;
        matchType = 'exact';
      } else if (isTrgmActive) {
        const sim = calculateSimilarity(lowerQ, `${p.first_name} ${p.last_name}`);
        if (sim >= 0.25) {
          score = sim;
          matchType = 'trigram_fuzzy';
        }
      }

      if (score > 0.2) {
        results.push({
          id: p.id,
          module: 'people',
          entity_type: 'person',
          title: `${p.first_name} ${p.last_name}`,
          subtitle: p.role_title ? `${p.role_title} @ ${p.company || ''}` : p.company,
          preview: p.bio || p.notes || 'Contact profile',
          tags: tags.map((t) => ({ id: t.id, name: t.name, color: t.color })),
          score: Math.min(1.0, score),
          match_type: matchType,
          metadata: { avatar_url: p.avatar_url },
        });
      }
    }
  }

  // 2. Search Places
  if (!targetModule || targetModule === 'places') {
    for (const pl of db.places.values()) {
      const tags = db.getEntityTags(pl.id);
      if (targetTag && !tags.some((t) => t.id === targetTag)) continue;

      const searchableText = `${pl.name} ${pl.category} ${pl.address || ''} ${pl.description || ''}`.toLowerCase();
      let score = 0;
      let matchType: SearchResultItem['match_type'] = 'fts';

      if (!q) {
        score = 1.0;
      } else if (searchableText.includes(lowerQ)) {
        score = lowerQ.length / pl.name.length + 0.5;
        matchType = 'exact';
      } else if (isTrgmActive) {
        const sim = calculateSimilarity(lowerQ, pl.name);
        if (sim >= 0.25) {
          score = sim;
          matchType = 'trigram_fuzzy';
        }
      }

      if (score > 0.2) {
        results.push({
          id: pl.id,
          module: 'places',
          entity_type: 'place',
          title: pl.name,
          subtitle: `${pl.category} • ${pl.address || 'GPS ' + pl.latitude + ', ' + pl.longitude}`,
          preview: pl.description || pl.address || 'Geographic place',
          tags: tags.map((t) => ({ id: t.id, name: t.name, color: t.color })),
          score: Math.min(1.0, score),
          match_type: matchType,
          metadata: { category: pl.category, coordinates: [pl.latitude, pl.longitude] },
        });
      }
    }
  }

  // 3. Search Events
  if (!targetModule || targetModule === 'events') {
    for (const ev of db.events.values()) {
      const tags = db.getEntityTags(ev.id);
      if (targetTag && !tags.some((t) => t.id === targetTag)) continue;

      const searchableText = `${ev.title} ${ev.description || ''} ${ev.status}`.toLowerCase();
      let score = 0;
      let matchType: SearchResultItem['match_type'] = 'fts';

      if (!q) {
        score = 1.0;
      } else if (searchableText.includes(lowerQ)) {
        score = lowerQ.length / ev.title.length + 0.5;
        matchType = 'exact';
      } else if (isTrgmActive) {
        const sim = calculateSimilarity(lowerQ, ev.title);
        if (sim >= 0.25) {
          score = sim;
          matchType = 'trigram_fuzzy';
        }
      }

      if (score > 0.2) {
        results.push({
          id: ev.id,
          module: 'events',
          entity_type: 'event',
          title: ev.title,
          subtitle: `${ev.start_time.slice(0, 10)} • Status: ${ev.status}`,
          preview: ev.description || 'Timeline event',
          tags: tags.map((t) => ({ id: t.id, name: t.name, color: t.color })),
          score: Math.min(1.0, score),
          match_type: matchType,
          metadata: { status: ev.status, start_time: ev.start_time },
        });
      }
    }
  }

  // 4. Search Knowledge Items (including properties JSONB content!)
  if (!targetModule || targetModule === 'knowledge') {
    for (const kn of db.knowledgeItems.values()) {
      const tags = db.getEntityTags(kn.id);
      if (targetTag && !tags.some((t) => t.id === targetTag)) continue;

      const metaType = db.entityTypes.get(kn.entity_type_id);
      const jsonPropsString = JSON.stringify(kn.properties).toLowerCase();
      const searchableText = `${kn.title} ${kn.description || ''} ${kn.notes || ''} ${metaType?.name || ''} ${jsonPropsString}`.toLowerCase();

      let score = 0;
      let matchType: SearchResultItem['match_type'] = 'fts';

      if (!q) {
        score = 1.0;
      } else if (searchableText.includes(lowerQ)) {
        score = lowerQ.length / kn.title.length + 0.6;
        matchType = 'exact';
      } else if (isTrgmActive) {
        const sim = calculateSimilarity(lowerQ, kn.title);
        if (sim >= 0.25) {
          score = sim;
          matchType = 'trigram_fuzzy';
        }
      }

      if (score > 0.2) {
        results.push({
          id: kn.id,
          module: 'knowledge',
          entity_type: 'knowledge_item',
          title: kn.title,
          subtitle: `Type: ${metaType?.name || kn.entity_type_id}`,
          preview: kn.description || kn.notes || Object.entries(kn.properties).map(([k, v]) => `${k}: ${v}`).join('; '),
          tags: tags.map((t) => ({ id: t.id, name: t.name, color: t.color })),
          score: Math.min(1.0, score),
          match_type: matchType,
          metadata: { type_name: metaType?.name, type_code: metaType?.code },
        });
      }
    }
  }

  // 5. Search Buildings
  if (!targetModule || targetModule === 'buildings') {
    for (const b of db.buildings.values()) {
      const tags = db.getEntityTags(b.id);
      if (targetTag && !tags.some((t) => t.id === targetTag)) continue;

      const searchableText = `${b.name} ${b.code} ${b.building_type} ${b.address || ''} ${b.notes || ''}`.toLowerCase();
      let score = 0;
      let matchType: SearchResultItem['match_type'] = 'fts';

      if (!q) {
        score = 1.0;
      } else if (searchableText.includes(lowerQ)) {
        score = lowerQ.length / b.name.length + 0.5;
        matchType = 'exact';
      } else if (isTrgmActive) {
        const sim = calculateSimilarity(lowerQ, b.name);
        if (sim >= 0.25) {
          score = sim;
          matchType = 'trigram_fuzzy';
        }
      }

      if (score > 0.2) {
        results.push({
          id: b.id,
          module: 'buildings',
          entity_type: 'building',
          title: b.name,
          subtitle: `${b.building_type} (${b.code})`,
          preview: `${b.total_area_sqm} m² • ${b.floors_count} floors • ${b.address || ''}`,
          tags: tags.map((t) => ({ id: t.id, name: t.name, color: t.color })),
          score: Math.min(1.0, score),
          match_type: matchType,
        });
      }
    }
  }

  // Sort by score descending
  results.sort((a, b) => b.score - a.score);

  return res.json({
    query: q,
    total: results.length,
    pg_trgm_enabled: isTrgmActive,
    results: results.slice(0, 30),
  });
});

export default router;
