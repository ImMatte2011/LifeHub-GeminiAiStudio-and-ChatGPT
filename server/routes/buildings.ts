import { Router } from 'express';
import { db } from '../db/database.js';
import { BuildingsBuilding } from '../db/types.js';
import { ExtensionManager } from '../services/extensionManager.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// List Buildings
router.get('/', (req, res) => {
  const buildings = Array.from(db.buildings.values()).map((b) => {
    const entity = db.entities.get(b.id);
    const tags = db.getEntityTags(b.id);
    const place = b.place_id ? db.places.get(b.place_id) : undefined;
    const manager = b.manager_person_id ? db.people.get(b.manager_person_id) : undefined;

    return {
      ...b,
      entity,
      tags,
      place,
      manager,
      maps_extension_ready: ExtensionManager.isExtensionAvailable('maps'),
    };
  });

  return res.json(buildings);
});

// Single Building
router.get('/:id', (req, res) => {
  const b = db.buildings.get(req.params.id);
  if (!b) return res.status(404).json({ error: 'Building not found' });

  const entity = db.entities.get(b.id);
  const tags = db.getEntityTags(b.id);
  const place = b.place_id ? db.places.get(b.place_id) : undefined;
  const manager = b.manager_person_id ? db.people.get(b.manager_person_id) : undefined;
  const links = db.getEntityLinks(b.id);

  return res.json({
    ...b,
    entity,
    tags,
    place,
    manager,
    links,
    maps_extension_ready: ExtensionManager.isExtensionAvailable('maps'),
  });
});

// Create Building
router.post('/', (req: AuthenticatedRequest, res) => {
  const {
    name,
    code,
    building_type,
    address,
    place_id,
    manager_person_id,
    floors_count,
    total_area_sqm,
    notes,
    tags,
  } = req.body;

  if (!name || !code) {
    return res.status(400).json({ error: 'Name and Code are required' });
  }

  const id = 'bld_' + Math.random().toString(36).substring(2, 9);
  const userId = req.userId || 'user_admin';

  // 1. Register into core.entities
  db.registerEntity(id, 'building', `${name} (${code})`, userId);

  // 2. Create in buildings.buildings
  const building: BuildingsBuilding = {
    id,
    name,
    code,
    building_type: building_type || 'Server Room',
    address,
    place_id,
    manager_person_id,
    floors_count: Number(floors_count) || 1,
    total_area_sqm: Number(total_area_sqm) || 100,
    notes,
  };
  db.buildings.set(id, building);

  // 3. Attach tags
  if (Array.isArray(tags)) {
    for (const tagId of tags) {
      db.addEntityTag(id, tagId);
    }
  }

  // 4. If manager assigned, create shared link
  if (manager_person_id) {
    db.addLink(id, manager_person_id, 'lt_manages', 'Building facility manager');
  }

  db.logAudit(userId, 'CREATE', `Created Building Asset: ${name} [Phase 12 Reusability Demo]`, id, 'building');

  return res.json({
    ...building,
    entity: db.entities.get(id),
    tags: db.getEntityTags(id),
  });
});

// Delete Building
router.delete('/:id', (req: AuthenticatedRequest, res) => {
  const b = db.buildings.get(req.params.id);
  if (!b) return res.status(404).json({ error: 'Building not found' });
  const userId = req.userId || 'user_admin';

  db.deleteEntity(b.id);
  db.buildings.delete(b.id);

  db.logAudit(userId, 'DELETE', `Deleted Building: ${b.name}`, b.id, 'building');

  return res.json({ success: true });
});

export default router;
