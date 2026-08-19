import { Router } from 'express';
import { db } from '../db/database.js';
import { KnowledgeItem } from '../db/types.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// Validate properties against Meta Layer Property Definitions
function validateProperties(entityTypeId: string, properties: Record<string, any>) {
  const definitions = Array.from(db.propertyDefinitions.values()).filter(
    (d) => d.entity_type_id === entityTypeId
  );

  const errors: string[] = [];

  for (const def of definitions) {
    const val = properties[def.code];
    if (def.is_required && (val === undefined || val === null || val === '')) {
      errors.push(`Field "${def.label}" (${def.code}) is required.`);
    }

    if (val !== undefined && val !== null && val !== '') {
      if (def.data_type === 'number' && isNaN(Number(val))) {
        errors.push(`Field "${def.label}" must be a valid number.`);
      }
      if (def.data_type === 'select' && def.enum_values && !def.enum_values.includes(String(val))) {
        errors.push(`Field "${def.label}" value "${val}" is not in allowed options.`);
      }
    }
  }

  return errors;
}

// List Knowledge Items with Meta Type info and tags
router.get('/', (req, res) => {
  const { entity_type_id, tag_id } = req.query;

  let items = Array.from(db.knowledgeItems.values()).map((item) => {
    const entity = db.entities.get(item.id);
    const metaType = db.entityTypes.get(item.entity_type_id);
    const tags = db.getEntityTags(item.id);
    const propDefs = Array.from(db.propertyDefinitions.values()).filter(
      (d) => d.entity_type_id === item.entity_type_id
    );

    return {
      ...item,
      entity,
      meta_type: metaType,
      tags,
      property_definitions: propDefs,
    };
  });

  if (entity_type_id) {
    items = items.filter((i) => i.entity_type_id === entity_type_id);
  }

  if (tag_id) {
    items = items.filter((i) => i.tags.some((t) => t.id === tag_id));
  }

  return res.json(items);
});

// Single Knowledge Item
router.get('/:id', (req, res) => {
  const item = db.knowledgeItems.get(req.params.id);
  if (!item) return res.status(404).json({ error: 'Item not found' });

  const entity = db.entities.get(item.id);
  const metaType = db.entityTypes.get(item.entity_type_id);
  const tags = db.getEntityTags(item.id);
  const propDefs = Array.from(db.propertyDefinitions.values()).filter(
    (d) => d.entity_type_id === item.entity_type_id
  );
  const links = db.getEntityLinks(item.id);

  return res.json({
    ...item,
    entity,
    meta_type: metaType,
    tags,
    property_definitions: propDefs,
    links,
  });
});

// Create Knowledge Item with Meta Layer Validation
router.post('/', (req: AuthenticatedRequest, res) => {
  const { entity_type_id, title, description, notes, properties = {}, tags } = req.body;

  if (!entity_type_id || !title) {
    return res.status(400).json({ error: 'entity_type_id and title are required' });
  }

  const metaType = db.entityTypes.get(entity_type_id);
  if (!metaType) {
    return res.status(400).json({ error: `Meta Entity Type "${entity_type_id}" does not exist.` });
  }

  // Validate JSONB properties against Meta Layer schema
  const validationErrors = validateProperties(entity_type_id, properties);
  if (validationErrors.length > 0) {
    return res.status(422).json({
      error: 'Meta Layer Property Validation Failed',
      validation_errors: validationErrors,
    });
  }

  const id = 'know_' + Math.random().toString(36).substring(2, 9);
  const userId = req.userId || 'user_admin';

  // 1. Register into core.entities
  db.registerEntity(id, 'knowledge_item', title, userId);

  // 2. Create in knowledge.items
  const item: KnowledgeItem = {
    id,
    entity_type_id,
    title,
    description,
    notes,
    properties,
  };
  db.knowledgeItems.set(id, item);

  // 3. Attach tags
  if (Array.isArray(tags)) {
    for (const tagId of tags) {
      db.addEntityTag(id, tagId);
    }
  }

  db.logAudit(userId, 'CREATE', `Created Knowledge Item (${metaType.name}): ${title}`, id, 'knowledge_item');

  return res.json({
    ...item,
    entity: db.entities.get(id),
    meta_type: metaType,
    tags: db.getEntityTags(id),
  });
});

// Update Knowledge Item
router.put('/:id', (req: AuthenticatedRequest, res) => {
  const item = db.knowledgeItems.get(req.params.id);
  if (!item) return res.status(404).json({ error: 'Item not found' });
  const userId = req.userId || 'user_admin';

  const { title, description, notes, properties, tags } = req.body;

  if (title) item.title = title;
  if (description !== undefined) item.description = description;
  if (notes !== undefined) item.notes = notes;

  if (properties) {
    const validationErrors = validateProperties(item.entity_type_id, properties);
    if (validationErrors.length > 0) {
      return res.status(422).json({
        error: 'Meta Layer Property Validation Failed',
        validation_errors: validationErrors,
      });
    }
    item.properties = properties;
  }

  db.registerEntity(item.id, 'knowledge_item', item.title, userId);

  if (Array.isArray(tags)) {
    db.entityTags = db.entityTags.filter((et) => et.entity_id !== item.id);
    for (const tagId of tags) {
      db.addEntityTag(item.id, tagId);
    }
  }

  db.logAudit(userId, 'UPDATE', `Updated Knowledge Item: ${item.title}`, item.id, 'knowledge_item');

  return res.json({
    ...item,
    tags: db.getEntityTags(item.id),
  });
});

// Delete Knowledge Item
router.delete('/:id', (req: AuthenticatedRequest, res) => {
  const item = db.knowledgeItems.get(req.params.id);
  if (!item) return res.status(404).json({ error: 'Item not found' });
  const userId = req.userId || 'user_admin';

  db.deleteEntity(item.id);
  db.knowledgeItems.delete(item.id);

  db.logAudit(userId, 'DELETE', `Deleted Knowledge Item: ${item.title}`, item.id, 'knowledge_item');

  return res.json({ success: true });
});

export default router;
