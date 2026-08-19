import { Router } from 'express';
import { db } from '../db/database.js';
import { MetaEntityType, MetaPropertyDefinition } from '../db/types.js';
import { AuthenticatedRequest, requireAuth } from '../middleware/auth.js';

const router = Router();

// Protect all meta routes
router.use(requireAuth);

// Entity Types (Dynamic Domain Catalogs)
router.get('/entity-types', (req, res) => {
  return res.json(Array.from(db.entityTypes.values()));
});

router.post('/entity-types', (req: AuthenticatedRequest, res) => {
  const { code, name, icon, description } = req.body;
  if (!code || !name) {
    return res.status(400).json({ error: 'Code and Name are required' });
  }

  const id = 'meta_' + code.toLowerCase().replace(/[^a-z0-9]/g, '_');
  if (db.entityTypes.has(id)) {
    return res.status(400).json({ error: 'Entity type with this code already exists' });
  }

  const userId = req.userId || 'user_admin';

  const newType: MetaEntityType = {
    id,
    code,
    name,
    icon: icon || 'FileText',
    description: description || '',
    schema_version: 1,
  };

  db.entityTypes.set(id, newType);
  db.logAudit(userId, 'CREATE', `Created Meta Entity Type: ${name} (${code})`, id, 'meta_entity_type');

  return res.json(newType);
});

router.put('/entity-types/:id', (req: AuthenticatedRequest, res) => {
  const type = db.entityTypes.get(req.params.id);
  if (!type) return res.status(404).json({ error: 'Entity type not found' });
  const userId = req.userId || 'user_admin';

  const { name, icon, description } = req.body;
  if (name) type.name = name;
  if (icon) type.icon = icon;
  if (description !== undefined) type.description = description;
  type.schema_version += 1;

  db.logAudit(userId, 'UPDATE', `Updated Meta Entity Type: ${type.name}`, type.id, 'meta_entity_type');
  return res.json(type);
});

// Property Definitions
router.get('/property-definitions', (req, res) => {
  const { entity_type_id } = req.query;
  let defs = Array.from(db.propertyDefinitions.values());
  if (entity_type_id) {
    defs = defs.filter((d) => d.entity_type_id === entity_type_id);
  }
  defs.sort((a, b) => a.sort_order - b.sort_order);
  return res.json(defs);
});

router.post('/property-definitions', (req: AuthenticatedRequest, res) => {
  const {
    entity_type_id,
    code,
    label,
    data_type,
    is_required,
    sort_order,
    enum_values,
    default_value,
  } = req.body;

  if (!entity_type_id || !code || !label || !data_type) {
    return res.status(400).json({ error: 'entity_type_id, code, label, and data_type are required' });
  }

  const id = 'pd_' + Math.random().toString(36).substring(2, 9);
  const userId = req.userId || 'user_admin';

  const def: MetaPropertyDefinition = {
    id,
    entity_type_id,
    code,
    label,
    data_type,
    is_required: Boolean(is_required),
    sort_order: Number(sort_order) || 1,
    enum_values: Array.isArray(enum_values) ? enum_values : undefined,
    default_value,
  };

  db.propertyDefinitions.set(id, def);
  db.logAudit(
    userId,
    'CREATE',
    `Added property definition ${label} (${code}) to type ${entity_type_id}`,
    id,
    'meta_property_definition'
  );

  return res.json(def);
});

router.delete('/property-definitions/:id', (req: AuthenticatedRequest, res) => {
  const def = db.propertyDefinitions.get(req.params.id);
  if (!def) return res.status(404).json({ error: 'Property definition not found' });
  const userId = req.userId || 'user_admin';

  db.propertyDefinitions.delete(req.params.id);
  db.logAudit(userId, 'DELETE', `Deleted property definition ${def.label}`, def.id, 'meta_property_definition');
  return res.json({ success: true });
});

// Full Meta Schema descriptor for dynamic frontend form generation
router.get('/schema/:typeId', (req, res) => {
  const type = db.entityTypes.get(req.params.typeId);
  if (!type) return res.status(404).json({ error: 'Type not found' });

  const properties = Array.from(db.propertyDefinitions.values())
    .filter((d) => d.entity_type_id === type.id)
    .sort((a, b) => a.sort_order - b.sort_order);

  return res.json({
    type,
    properties,
  });
});

export default router;
