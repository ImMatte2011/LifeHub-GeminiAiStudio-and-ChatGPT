import { Router } from 'express';
import { dbManager } from '../db/databaseManager.js';

const router = Router();

// GET /api/databases - List all database instances
router.get('/', (req, res) => {
  const dbs = dbManager.getDatabaseList();
  const activeId = dbManager.getActiveDatabaseId();
  return res.json({
    active_database_id: activeId,
    databases: dbs,
  });
});

// POST /api/databases/active - Switch the active database
router.post('/active', (req, res) => {
  const { id } = req.body;
  if (!id) {
    return res.status(400).json({ error: 'Database ID is required' });
  }

  const success = dbManager.setActiveDatabase(id);
  if (!success) {
    return res.status(404).json({ error: `Database '${id}' not found` });
  }

  return res.json({
    success: true,
    active_database_id: id,
    databases: dbManager.getDatabaseList(),
  });
});

// POST /api/databases - Create a new database instance
router.post('/', (req, res) => {
  const { id, name, description, category } = req.body;
  if (!id || !name) {
    return res.status(400).json({ error: 'ID and Name are required to create a database' });
  }

  try {
    const created = dbManager.createDatabase(id, name, description || '', category || 'custom');
    return res.status(201).json(created);
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed to create database' });
  }
});

// GET /api/databases/:dbId/schemas - Get all schemas for a database
router.get('/:dbId/schemas', (req, res) => {
  const { dbId } = req.params;
  try {
    const schemas = dbManager.getSchemasForDatabase(dbId);
    return res.json({
      database_id: dbId,
      total_schemas: schemas.length,
      schemas,
    });
  } catch (err: any) {
    return res.status(404).json({ error: err.message || 'Database schemas not found' });
  }
});

// GET /api/databases/:dbId/schemas/:schemaName - Get details for a specific schema
router.get('/:dbId/schemas/:schemaName', (req, res) => {
  const { dbId, schemaName } = req.params;
  const schemas = dbManager.getSchemasForDatabase(dbId);
  const targetSchema = schemas.find((s) => s.name.toLowerCase() === schemaName.toLowerCase());

  if (!targetSchema) {
    return res.status(404).json({ error: `Schema '${schemaName}' not found in database '${dbId}'` });
  }

  return res.json(targetSchema);
});

// GET /api/databases/:dbId/schemas/:schemaName/tables/:tableName/records - Get records for a specific table
router.get('/:dbId/schemas/:schemaName/tables/:tableName/records', (req, res) => {
  const { dbId, schemaName, tableName } = req.params;
  const { search, limit = 50, page = 1 } = req.query;

  try {
    let records = dbManager.getTableRecords(dbId, schemaName, tableName);

    // Optional in-memory search
    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      records = records.filter((r) =>
        Object.values(r).some((v) =>
          typeof v === 'string'
            ? v.toLowerCase().includes(q)
            : typeof v === 'number'
            ? v.toString().includes(q)
            : false
        )
      );
    }

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 50));
    const offset = (pageNum - 1) * limitNum;
    const paginated = records.slice(offset, offset + limitNum);

    return res.json({
      total: records.length,
      page: pageNum,
      limit: limitNum,
      records: paginated,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to fetch table records' });
  }
});

// GET /api/databases/compare - Compare two schemas or two databases side-by-side
router.get('/compare', (req, res) => {
  const { dbA = 'lifehub_main', schemaA = 'people', dbB = 'lifehub_main', schemaB = 'shared' } = req.query;

  const schemasA = dbManager.getSchemasForDatabase(dbA as string);
  const schemasB = dbManager.getSchemasForDatabase(dbB as string);

  const foundA = schemasA.find((s) => s.name.toLowerCase() === (schemaA as string).toLowerCase());
  const foundB = schemasB.find((s) => s.name.toLowerCase() === (schemaB as string).toLowerCase());

  if (!foundA || !foundB) {
    return res.status(404).json({ error: 'One or both schemas not found' });
  }

  // Cross-reference foreign keys between Schema A and Schema B
  const crossFksAtoB = foundA.tables.flatMap((t) =>
    t.foreign_keys.filter((fk) => fk.target_schema === foundB.name)
  );
  const crossFksBtoA = foundB.tables.flatMap((t) =>
    t.foreign_keys.filter((fk) => fk.target_schema === foundA.name)
  );

  return res.json({
    left: {
      database_id: dbA,
      schema: foundA,
    },
    right: {
      database_id: dbB,
      schema: foundB,
    },
    comparison: {
      tables_count_diff: foundA.total_tables - foundB.total_tables,
      rows_count_diff: foundA.total_rows - foundB.total_rows,
      cross_relations_A_to_B: crossFksAtoB,
      cross_relations_B_to_A: crossFksBtoA,
      shared_entity_roots: ['core.entities'],
    },
  });
});

export default router;
