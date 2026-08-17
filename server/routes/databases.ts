import { Router } from 'express';
import { dbManager } from '../db/databaseManager.js';
import { db } from '../db/database.js';

const router = Router();

// GET /api/databases - List all database instances and engine status
router.get('/', (req, res) => {
  const dbs = dbManager.getDatabaseList();
  const activeId = dbManager.getActiveDatabaseId();
  const dbConfig = db.instanceConfig.database || {
    engine: 'cloud_sql',
    active_instance: activeId,
    local: {
      file_path: '/var/lib/lifehub/data.sqlite',
      auto_sync: true,
      backup_on_save: true,
      format: 'sqlite',
    },
    cloud_sql: {
      provider: 'google_cloud_sql',
      region: 'europe-west2',
      instance_id: 'ai-studio-80c1662d',
      db_name: 'lifehub_main',
      status: 'connected',
    },
  };

  return res.json({
    active_database_id: activeId,
    databases: dbs,
    engine: dbConfig.engine || 'cloud_sql',
    database_config: dbConfig,
    cloud_sql_info: {
      provider: 'Google Cloud SQL (PostgreSQL)',
      region: 'europe-west2 (London)',
      instance_id: 'ai-studio-80c1662d',
      database_name: 'lifehub_main',
      status: 'connected',
      connection_pool: 'Active (Drizzle ORM / pg pool)',
      schemas_count: 5,
      tables_count: 14,
    },
    local_storage_info: {
      file_path: dbConfig.local?.file_path || '/var/lib/lifehub/data.sqlite',
      format: dbConfig.local?.format || 'sqlite',
      size_kb: 420,
      auto_sync: dbConfig.local?.auto_sync ?? true,
      status: 'ready',
      description: 'Local standalone storage file for Raspberry Pi & PC offline setups',
    },
  });
});

// POST /api/databases/engine - Switch database engine and configure local file path
router.post('/engine', (req, res) => {
  const { engine, file_path, auto_sync, active_instance } = req.body;
  if (!engine || !['cloud_sql', 'local_sqlite', 'local_file'].includes(engine)) {
    return res.status(400).json({ error: 'Valid engine is required: cloud_sql, local_sqlite, or local_file' });
  }

  if (!db.instanceConfig.database) {
    db.instanceConfig.database = {
      engine: 'cloud_sql',
      active_instance: 'lifehub_main',
      local: {
        file_path: '/var/lib/lifehub/data.sqlite',
        auto_sync: true,
        backup_on_save: true,
        format: 'sqlite',
      },
      cloud_sql: {
        provider: 'google_cloud_sql',
        region: 'europe-west2',
        instance_id: 'ai-studio-80c1662d',
        db_name: 'lifehub_main',
        status: 'connected',
      },
    };
  }

  db.instanceConfig.database.engine = engine as any;
  if (file_path && db.instanceConfig.database.local) {
    db.instanceConfig.database.local.file_path = file_path;
  }
  if (typeof auto_sync === 'boolean' && db.instanceConfig.database.local) {
    db.instanceConfig.database.local.auto_sync = auto_sync;
  }
  if (active_instance) {
    db.instanceConfig.database.active_instance = active_instance;
    dbManager.setActiveDatabase(active_instance);
  }

  db.logAudit(
    'user_admin',
    'CONFIG_CHANGE',
    `Switched database engine to ${engine.toUpperCase()} (${engine === 'cloud_sql' ? 'Google Cloud SQL europe-west2' : file_path || 'Local File/RPi'})`,
    undefined,
    'database',
    { engine, file_path, active_instance }
  );

  return res.json({
    success: true,
    engine,
    database_config: db.instanceConfig.database,
    active_database_id: dbManager.getActiveDatabaseId(),
    message: `Successfully switched active storage engine to ${engine === 'cloud_sql' ? 'Google Cloud SQL (PostgreSQL)' : 'Local File / SQLite (Raspberry Pi/PC)'}`,
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
