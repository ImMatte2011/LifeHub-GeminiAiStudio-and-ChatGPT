import { LifeHubDatabase, db as mainDb } from './database.js';

export interface DatabaseInfo {
  id: string;
  name: string;
  description: string;
  category: 'primary' | 'finance' | 'research' | 'iot' | 'custom';
  created_at: string;
  is_active: boolean;
  size_mb: number;
  total_schemas: number;
  total_tables: number;
  total_records: number;
}

export interface ColumnDefinition {
  name: string;
  type: string;
  is_pk: boolean;
  is_fk: boolean;
  fk_target?: string;
  is_nullable: boolean;
  default_value?: string;
  description?: string;
  indexes?: string[];
}

export interface ForeignKeyRelation {
  column: string;
  target_schema: string;
  target_table: string;
  target_column: string;
  constraint_name: string;
}

export interface TableDefinition {
  name: string;
  schema_name: string;
  display_name: string;
  description: string;
  row_count: number;
  columns: ColumnDefinition[];
  foreign_keys: ForeignKeyRelation[];
  ddl: string;
}

export interface SchemaDefinition {
  name: string;
  display_name: string;
  category: 'core' | 'meta' | 'shared' | 'domain' | 'custom';
  description: string;
  color: string;
  icon: string;
  total_tables: number;
  total_rows: number;
  tables: TableDefinition[];
}

class DatabaseManager {
  private databases: Map<string, { info: DatabaseInfo; instance: LifeHubDatabase }> = new Map();
  private activeDbId: string = 'lifehub_main';

  constructor() {
    this.initPreloadedDatabases();
  }

  private initPreloadedDatabases() {
    // 1. Primary Default DB: lifehub_main
    this.databases.set('lifehub_main', {
      info: {
        id: 'lifehub_main',
        name: 'LifeHub Main (Second Brain)',
        description: 'Primary personal knowledge, people, places, events, and building assets repository.',
        category: 'primary',
        created_at: '2026-08-01T00:00:00.000Z',
        is_active: true,
        size_mb: 4.8,
        total_schemas: 8,
        total_tables: 19,
        total_records: 62,
      },
      instance: mainDb,
    });

    // 2. Secondary DB: lifehub_finance
    const financeDb = new LifeHubDatabase();
    financeDb.instanceConfig.instance.name = 'LifeHub Finance & Wealth';
    financeDb.instanceConfig.instance.description = 'Personal finances, budget tracking, asset valuations & investments.';
    this.databases.set('lifehub_finance', {
      info: {
        id: 'lifehub_finance',
        name: 'LifeHub Finance & Wealth',
        description: 'Personal finances, budget tracking, asset valuations, investments, and expense ledger.',
        category: 'finance',
        created_at: '2026-08-10T12:00:00.000Z',
        is_active: false,
        size_mb: 2.1,
        total_schemas: 5,
        total_tables: 12,
        total_records: 38,
      },
      instance: financeDb,
    });

    // 3. Secondary DB: lifehub_research
    const researchDb = new LifeHubDatabase();
    researchDb.instanceConfig.instance.name = 'LifeHub Research & Science';
    researchDb.instanceConfig.instance.description = 'Scientific literature, academic citations, dataset archives, and lab notes.';
    this.databases.set('lifehub_research', {
      info: {
        id: 'lifehub_research',
        name: 'LifeHub Research & Science',
        description: 'Scientific literature, academic citations, dataset archives, laboratory notes, and papers.',
        category: 'research',
        created_at: '2026-08-12T09:30:00.000Z',
        is_active: false,
        size_mb: 3.4,
        total_schemas: 6,
        total_tables: 14,
        total_records: 45,
      },
      instance: researchDb,
    });
  }

  public getDatabaseList(): DatabaseInfo[] {
    return Array.from(this.databases.values()).map((dbEntry) => {
      const schemas = this.getSchemasForDatabase(dbEntry.info.id);
      const total_tables = schemas.reduce((acc, s) => acc + s.total_tables, 0);
      const total_records = schemas.reduce((acc, s) => acc + s.total_rows, 0);
      return {
        ...dbEntry.info,
        is_active: dbEntry.info.id === this.activeDbId,
        total_schemas: schemas.length,
        total_tables,
        total_records,
      };
    });
  }

  public getActiveDatabaseId(): string {
    return this.activeDbId;
  }

  public setActiveDatabase(id: string): boolean {
    if (this.databases.has(id)) {
      this.activeDbId = id;
      return true;
    }
    return false;
  }

  public getDatabaseInstance(id?: string): LifeHubDatabase {
    const targetId = id || this.activeDbId;
    const entry = this.databases.get(targetId);
    return entry ? entry.instance : mainDb;
  }

  public createDatabase(
    id: string,
    name: string,
    description: string,
    category: DatabaseInfo['category'] = 'custom'
  ): DatabaseInfo {
    const cleanId = id.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    if (this.databases.has(cleanId)) {
      throw new Error(`Database with ID '${cleanId}' already exists`);
    }

    const newDb = new LifeHubDatabase();
    newDb.instanceConfig.instance.name = name;
    newDb.instanceConfig.instance.description = description;

    const info: DatabaseInfo = {
      id: cleanId,
      name,
      description,
      category,
      created_at: new Date().toISOString(),
      is_active: false,
      size_mb: 1.2,
      total_schemas: 8,
      total_tables: 19,
      total_records: 20,
    };

    this.databases.set(cleanId, { info, instance: newDb });
    return info;
  }

  public getSchemasForDatabase(dbId: string): SchemaDefinition[] {
    const db = this.getDatabaseInstance(dbId);
    const schemas: SchemaDefinition[] = [];

    // 1. CORE SCHEMA
    const coreTables: TableDefinition[] = [
      {
        name: 'users',
        schema_name: 'core',
        display_name: 'System Users',
        description: 'Authenticated human users, passwords, and security status.',
        row_count: db.users.size,
        columns: [
          { name: 'id', type: 'varchar(64)', is_pk: true, is_fk: false, is_nullable: false, description: 'Unique user identifier' },
          { name: 'username', type: 'varchar(64)', is_pk: false, is_fk: false, is_nullable: false, indexes: ['btree_users_username_uniq'] },
          { name: 'email', type: 'varchar(255)', is_pk: false, is_fk: false, is_nullable: false, indexes: ['btree_users_email_uniq'] },
          { name: 'full_name', type: 'varchar(255)', is_pk: false, is_fk: false, is_nullable: false },
          { name: 'role_id', type: 'varchar(64)', is_pk: false, is_fk: true, fk_target: 'core.roles(id)', is_nullable: false },
          { name: 'is_active', type: 'boolean', is_pk: false, is_fk: false, is_nullable: false, default_value: 'true' },
          { name: 'created_at', type: 'timestamp with time zone', is_pk: false, is_fk: false, is_nullable: false, default_value: 'CURRENT_TIMESTAMP' },
          { name: 'updated_at', type: 'timestamp with time zone', is_pk: false, is_fk: false, is_nullable: false },
        ],
        foreign_keys: [
          { column: 'role_id', target_schema: 'core', target_table: 'roles', target_column: 'id', constraint_name: 'fk_users_role' },
        ],
        ddl: `CREATE TABLE core.users (
  id VARCHAR(64) PRIMARY KEY,
  username VARCHAR(64) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  full_name VARCHAR(255) NOT NULL,
  role_id VARCHAR(64) NOT NULL REFERENCES core.roles(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);`,
      },
      {
        name: 'roles',
        schema_name: 'core',
        display_name: 'Security Roles',
        description: 'RBAC user roles (admin, editor, member, viewer).',
        row_count: db.roles.size,
        columns: [
          { name: 'id', type: 'varchar(64)', is_pk: true, is_fk: false, is_nullable: false },
          { name: 'name', type: 'varchar(128)', is_pk: false, is_fk: false, is_nullable: false },
          { name: 'description', type: 'text', is_pk: false, is_fk: false, is_nullable: true },
          { name: 'is_admin', type: 'boolean', is_pk: false, is_fk: false, is_nullable: false, default_value: 'false' },
        ],
        foreign_keys: [],
        ddl: `CREATE TABLE core.roles (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(128) NOT NULL,
  description TEXT,
  is_admin BOOLEAN NOT NULL DEFAULT false
);`,
      },
      {
        name: 'entities',
        schema_name: 'core',
        display_name: 'Master Entity Registry',
        description: 'Universal registry mapping every domain entity ID across all modules.',
        row_count: db.entities.size,
        columns: [
          { name: 'id', type: 'varchar(64)', is_pk: true, is_fk: false, is_nullable: false, description: 'Master entity ID (shared with domain tables)' },
          { name: 'entity_type', type: 'varchar(64)', is_pk: false, is_fk: false, is_nullable: false, indexes: ['btree_entities_type'] },
          { name: 'title', type: 'varchar(255)', is_pk: false, is_fk: false, is_nullable: false, indexes: ['gin_entities_title_trgm'] },
          { name: 'created_at', type: 'timestamp with time zone', is_pk: false, is_fk: false, is_nullable: false },
          { name: 'updated_at', type: 'timestamp with time zone', is_pk: false, is_fk: false, is_nullable: false },
          { name: 'created_by', type: 'varchar(64)', is_pk: false, is_fk: true, fk_target: 'core.users(id)', is_nullable: false },
        ],
        foreign_keys: [
          { column: 'created_by', target_schema: 'core', target_table: 'users', target_column: 'id', constraint_name: 'fk_entities_created_by' },
        ],
        ddl: `CREATE TABLE core.entities (
  id VARCHAR(64) PRIMARY KEY,
  entity_type VARCHAR(64) NOT NULL,
  title VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by VARCHAR(64) NOT NULL REFERENCES core.users(id)
);
CREATE INDEX gin_entities_title_trgm ON core.entities USING gin (title gin_trgm_ops);`,
      },
      {
        name: 'modules',
        schema_name: 'core',
        display_name: 'System Modules',
        description: 'Registered modular capabilities and required extensions.',
        row_count: db.modules.size,
        columns: [
          { name: 'id', type: 'varchar(64)', is_pk: true, is_fk: false, is_nullable: false },
          { name: 'name', type: 'varchar(128)', is_pk: false, is_fk: false, is_nullable: false },
          { name: 'description', type: 'text', is_pk: false, is_fk: false, is_nullable: true },
          { name: 'is_enabled', type: 'boolean', is_pk: false, is_fk: false, is_nullable: false, default_value: 'true' },
          { name: 'required_extensions', type: 'text[]', is_pk: false, is_fk: false, is_nullable: false },
        ],
        foreign_keys: [],
        ddl: `CREATE TABLE core.modules (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(128) NOT NULL,
  description TEXT,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  required_extensions TEXT[] NOT NULL DEFAULT '{}'
);`,
      },
      {
        name: 'audit_log',
        schema_name: 'core',
        display_name: 'Audit Trail Logs',
        description: 'Append-only ledger recording every mutation, login, and config change.',
        row_count: db.auditLog.length,
        columns: [
          { name: 'id', type: 'varchar(64)', is_pk: true, is_fk: false, is_nullable: false },
          { name: 'user_id', type: 'varchar(64)', is_pk: false, is_fk: true, fk_target: 'core.users(id)', is_nullable: false },
          { name: 'username', type: 'varchar(64)', is_pk: false, is_fk: false, is_nullable: false },
          { name: 'action', type: 'varchar(32)', is_pk: false, is_fk: false, is_nullable: false },
          { name: 'entity_id', type: 'varchar(64)', is_pk: false, is_fk: false, is_nullable: true },
          { name: 'details', type: 'text', is_pk: false, is_fk: false, is_nullable: false },
          { name: 'timestamp', type: 'timestamp with time zone', is_pk: false, is_fk: false, is_nullable: false, indexes: ['btree_audit_ts_desc'] },
        ],
        foreign_keys: [
          { column: 'user_id', target_schema: 'core', target_table: 'users', target_column: 'id', constraint_name: 'fk_audit_user' },
        ],
        ddl: `CREATE TABLE core.audit_log (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL REFERENCES core.users(id),
  username VARCHAR(64) NOT NULL,
  action VARCHAR(32) NOT NULL,
  entity_id VARCHAR(64),
  details TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);`,
      },
    ];

    schemas.push({
      name: 'core',
      display_name: 'Core System Schema',
      category: 'core',
      description: 'Platform infrastructure: authentication, sessions, permissions, audit trail, and master entity registry.',
      color: 'blue',
      icon: 'Shield',
      total_tables: coreTables.length,
      total_rows: coreTables.reduce((sum, t) => sum + t.row_count, 0),
      tables: coreTables,
    });

    // 2. META SCHEMA
    const metaTables: TableDefinition[] = [
      {
        name: 'entity_types',
        schema_name: 'meta',
        display_name: 'Meta Entity Types',
        description: 'Dynamic schema types (e.g. book, ammo, software, recipe) without DDL changes.',
        row_count: db.entityTypes.size,
        columns: [
          { name: 'id', type: 'varchar(64)', is_pk: true, is_fk: false, is_nullable: false },
          { name: 'name', type: 'varchar(128)', is_pk: false, is_fk: false, is_nullable: false },
          { name: 'code', type: 'varchar(64)', is_pk: false, is_fk: false, is_nullable: false, indexes: ['btree_meta_type_code_uniq'] },
          { name: 'description', type: 'text', is_pk: false, is_fk: false, is_nullable: true },
          { name: 'module_name', type: 'varchar(64)', is_pk: false, is_fk: false, is_nullable: false },
          { name: 'icon', type: 'varchar(64)', is_pk: false, is_fk: false, is_nullable: false },
        ],
        foreign_keys: [],
        ddl: `CREATE TABLE meta.entity_types (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(128) NOT NULL,
  code VARCHAR(64) NOT NULL UNIQUE,
  description TEXT,
  module_name VARCHAR(64) NOT NULL,
  icon VARCHAR(64) NOT NULL
);`,
      },
      {
        name: 'property_definitions',
        schema_name: 'meta',
        display_name: 'Dynamic Property Specs',
        description: 'Property definitions, data types, validations, and options for dynamic forms.',
        row_count: db.propertyDefinitions.size,
        columns: [
          { name: 'id', type: 'varchar(64)', is_pk: true, is_fk: false, is_nullable: false },
          { name: 'entity_type_id', type: 'varchar(64)', is_pk: false, is_fk: true, fk_target: 'meta.entity_types(id)', is_nullable: false },
          { name: 'code', type: 'varchar(64)', is_pk: false, is_fk: false, is_nullable: false },
          { name: 'label', type: 'varchar(128)', is_pk: false, is_fk: false, is_nullable: false },
          { name: 'data_type', type: 'varchar(32)', is_pk: false, is_fk: false, is_nullable: false },
          { name: 'is_required', type: 'boolean', is_pk: false, is_fk: false, is_nullable: false, default_value: 'false' },
          { name: 'enum_values', type: 'jsonb', is_pk: false, is_fk: false, is_nullable: true },
        ],
        foreign_keys: [
          { column: 'entity_type_id', target_schema: 'meta', target_table: 'entity_types', target_column: 'id', constraint_name: 'fk_prop_def_type' },
        ],
        ddl: `CREATE TABLE meta.property_definitions (
  id VARCHAR(64) PRIMARY KEY,
  entity_type_id VARCHAR(64) NOT NULL REFERENCES meta.entity_types(id),
  code VARCHAR(64) NOT NULL,
  label VARCHAR(128) NOT NULL,
  data_type VARCHAR(32) NOT NULL,
  is_required BOOLEAN NOT NULL DEFAULT false,
  enum_values JSONB
);`,
      },
    ];

    schemas.push({
      name: 'meta',
      display_name: 'Meta Layer Schema',
      category: 'meta',
      description: 'Dynamic schema definitions, dynamic JSONB field validators, and runtime UI form descriptors.',
      color: 'amber',
      icon: 'Sliders',
      total_tables: metaTables.length,
      total_rows: metaTables.reduce((sum, t) => sum + t.row_count, 0),
      tables: metaTables,
    });

    // 3. SHARED SCHEMA
    const sharedTables: TableDefinition[] = [
      {
        name: 'tags',
        schema_name: 'shared',
        display_name: 'Universal Tags',
        description: 'Cross-module classification labels and visual badges.',
        row_count: db.tags.size,
        columns: [
          { name: 'id', type: 'varchar(64)', is_pk: true, is_fk: false, is_nullable: false },
          { name: 'name', type: 'varchar(64)', is_pk: false, is_fk: false, is_nullable: false, indexes: ['btree_tags_name_uniq'] },
          { name: 'color', type: 'varchar(32)', is_pk: false, is_fk: false, is_nullable: false, default_value: "'blue'" },
        ],
        foreign_keys: [],
        ddl: `CREATE TABLE shared.tags (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(64) NOT NULL UNIQUE,
  color VARCHAR(32) NOT NULL DEFAULT 'blue'
);`,
      },
      {
        name: 'entity_tags',
        schema_name: 'shared',
        display_name: 'Entity Tag Mappings',
        description: 'Many-to-many associations between master entities and tags.',
        row_count: db.entityTags.length,
        columns: [
          { name: 'id', type: 'varchar(64)', is_pk: true, is_fk: false, is_nullable: false },
          { name: 'entity_id', type: 'varchar(64)', is_pk: false, is_fk: true, fk_target: 'core.entities(id)', is_nullable: false },
          { name: 'tag_id', type: 'varchar(64)', is_pk: false, is_fk: true, fk_target: 'shared.tags(id)', is_nullable: false },
        ],
        foreign_keys: [
          { column: 'entity_id', target_schema: 'core', target_table: 'entities', target_column: 'id', constraint_name: 'fk_entity_tags_entity' },
          { column: 'tag_id', target_schema: 'shared', target_table: 'tags', target_column: 'id', constraint_name: 'fk_entity_tags_tag' },
        ],
        ddl: `CREATE TABLE shared.entity_tags (
  id VARCHAR(64) PRIMARY KEY,
  entity_id VARCHAR(64) NOT NULL REFERENCES core.entities(id) ON DELETE CASCADE,
  tag_id VARCHAR(64) NOT NULL REFERENCES shared.tags(id) ON DELETE CASCADE,
  UNIQUE (entity_id, tag_id)
);`,
      },
      {
        name: 'link_types',
        schema_name: 'shared',
        display_name: 'Relationship Semantics',
        description: 'Relationship types with forward and reverse predicates.',
        row_count: db.linkTypes.size,
        columns: [
          { name: 'id', type: 'varchar(64)', is_pk: true, is_fk: false, is_nullable: false },
          { name: 'code', type: 'varchar(64)', is_pk: false, is_fk: false, is_nullable: false, indexes: ['btree_link_types_code'] },
          { name: 'forward_label', type: 'varchar(128)', is_pk: false, is_fk: false, is_nullable: false },
          { name: 'reverse_label', type: 'varchar(128)', is_pk: false, is_fk: false, is_nullable: false },
        ],
        foreign_keys: [],
        ddl: `CREATE TABLE shared.link_types (
  id VARCHAR(64) PRIMARY KEY,
  code VARCHAR(64) NOT NULL UNIQUE,
  forward_label VARCHAR(128) NOT NULL,
  reverse_label VARCHAR(128) NOT NULL
);`,
      },
      {
        name: 'links',
        schema_name: 'shared',
        display_name: 'Universal Entity Links',
        description: 'Universal graph edges connecting any entity to any other entity across all domains.',
        row_count: db.links.length,
        columns: [
          { name: 'id', type: 'varchar(64)', is_pk: true, is_fk: false, is_nullable: false },
          { name: 'source_entity_id', type: 'varchar(64)', is_pk: false, is_fk: true, fk_target: 'core.entities(id)', is_nullable: false },
          { name: 'target_entity_id', type: 'varchar(64)', is_pk: false, is_fk: true, fk_target: 'core.entities(id)', is_nullable: false },
          { name: 'link_type_id', type: 'varchar(64)', is_pk: false, is_fk: true, fk_target: 'shared.link_types(id)', is_nullable: false },
          { name: 'notes', type: 'text', is_pk: false, is_fk: false, is_nullable: true },
          { name: 'created_at', type: 'timestamp with time zone', is_pk: false, is_fk: false, is_nullable: false },
        ],
        foreign_keys: [
          { column: 'source_entity_id', target_schema: 'core', target_table: 'entities', target_column: 'id', constraint_name: 'fk_links_source' },
          { column: 'target_entity_id', target_schema: 'core', target_table: 'entities', target_column: 'id', constraint_name: 'fk_links_target' },
          { column: 'link_type_id', target_schema: 'shared', target_table: 'link_types', target_column: 'id', constraint_name: 'fk_links_type' },
        ],
        ddl: `CREATE TABLE shared.links (
  id VARCHAR(64) PRIMARY KEY,
  source_entity_id VARCHAR(64) NOT NULL REFERENCES core.entities(id) ON DELETE CASCADE,
  target_entity_id VARCHAR(64) NOT NULL REFERENCES core.entities(id) ON DELETE CASCADE,
  link_type_id VARCHAR(64) NOT NULL REFERENCES shared.link_types(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);`,
      },
    ];

    schemas.push({
      name: 'shared',
      display_name: 'Shared Services Schema',
      category: 'shared',
      description: 'Cross-cutting database utilities: universal tags, typed relationship links, and file attachments.',
      color: 'emerald',
      icon: 'Share2',
      total_tables: sharedTables.length,
      total_rows: sharedTables.reduce((sum, t) => sum + t.row_count, 0),
      tables: sharedTables,
    });

    // 4. PEOPLE SCHEMA
    const peopleTables: TableDefinition[] = [
      {
        name: 'persons',
        schema_name: 'people',
        display_name: 'Persons Profile',
        description: 'Individuals, contacts, professional titles, and biographic profiles.',
        row_count: db.people.size,
        columns: [
          { name: 'id', type: 'varchar(64)', is_pk: true, is_fk: true, fk_target: 'core.entities(id)', is_nullable: false },
          { name: 'first_name', type: 'varchar(128)', is_pk: false, is_fk: false, is_nullable: false },
          { name: 'last_name', type: 'varchar(128)', is_pk: false, is_fk: false, is_nullable: false },
          { name: 'role_title', type: 'varchar(128)', is_pk: false, is_fk: false, is_nullable: true },
          { name: 'company', type: 'varchar(128)', is_pk: false, is_fk: false, is_nullable: true },
          { name: 'bio', type: 'text', is_pk: false, is_fk: false, is_nullable: true },
          { name: 'notes', type: 'text', is_pk: false, is_fk: false, is_nullable: true },
          { name: 'avatar_url', type: 'text', is_pk: false, is_fk: false, is_nullable: true },
        ],
        foreign_keys: [
          { column: 'id', target_schema: 'core', target_table: 'entities', target_column: 'id', constraint_name: 'fk_persons_entity' },
        ],
        ddl: `CREATE TABLE people.persons (
  id VARCHAR(64) PRIMARY KEY REFERENCES core.entities(id) ON DELETE CASCADE,
  first_name VARCHAR(128) NOT NULL,
  last_name VARCHAR(128) NOT NULL,
  role_title VARCHAR(128),
  company VARCHAR(128),
  bio TEXT,
  notes TEXT,
  avatar_url TEXT
);`,
      },
      {
        name: 'contacts',
        schema_name: 'people',
        display_name: 'Contact Channels',
        description: 'Multi-channel communication coordinates (email, phone, matrix, signal, etc.).',
        row_count: db.contacts.size,
        columns: [
          { name: 'id', type: 'varchar(64)', is_pk: true, is_fk: false, is_nullable: false },
          { name: 'person_id', type: 'varchar(64)', is_pk: false, is_fk: true, fk_target: 'people.persons(id)', is_nullable: false },
          { name: 'type', type: 'varchar(32)', is_pk: false, is_fk: false, is_nullable: false },
          { name: 'value', type: 'varchar(255)', is_pk: false, is_fk: false, is_nullable: false },
          { name: 'label', type: 'varchar(64)', is_pk: false, is_fk: false, is_nullable: false },
          { name: 'is_primary', type: 'boolean', is_pk: false, is_fk: false, is_nullable: false, default_value: 'false' },
        ],
        foreign_keys: [
          { column: 'person_id', target_schema: 'people', target_table: 'persons', target_column: 'id', constraint_name: 'fk_contacts_person' },
        ],
        ddl: `CREATE TABLE people.contacts (
  id VARCHAR(64) PRIMARY KEY,
  person_id VARCHAR(64) NOT NULL REFERENCES people.persons(id) ON DELETE CASCADE,
  type VARCHAR(32) NOT NULL,
  value VARCHAR(255) NOT NULL,
  label VARCHAR(64) NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT false
);`,
      },
    ];

    schemas.push({
      name: 'people',
      display_name: 'People Domain Schema',
      category: 'domain',
      description: 'Domain module for contact management, personal networks, professional roles, and relationships.',
      color: 'indigo',
      icon: 'Users',
      total_tables: peopleTables.length,
      total_rows: peopleTables.reduce((sum, t) => sum + t.row_count, 0),
      tables: peopleTables,
    });

    // 5. PLACES SCHEMA
    const placesTables: TableDefinition[] = [
      {
        name: 'places',
        schema_name: 'places',
        display_name: 'Geographic Places',
        description: 'Spatial locations, coordinates, PostGIS geometry points, addresses, and categories.',
        row_count: db.places.size,
        columns: [
          { name: 'id', type: 'varchar(64)', is_pk: true, is_fk: true, fk_target: 'core.entities(id)', is_nullable: false },
          { name: 'name', type: 'varchar(255)', is_pk: false, is_fk: false, is_nullable: false },
          { name: 'category', type: 'varchar(64)', is_pk: false, is_fk: false, is_nullable: false },
          { name: 'address', type: 'varchar(255)', is_pk: false, is_fk: false, is_nullable: true },
          { name: 'latitude', type: 'double precision', is_pk: false, is_fk: false, is_nullable: false },
          { name: 'longitude', type: 'double precision', is_pk: false, is_fk: false, is_nullable: false },
          { name: 'geom', type: 'geography(Point, 4326)', is_pk: false, is_fk: false, is_nullable: false, indexes: ['gist_places_geom'] },
        ],
        foreign_keys: [
          { column: 'id', target_schema: 'core', target_table: 'entities', target_column: 'id', constraint_name: 'fk_places_entity' },
        ],
        ddl: `CREATE TABLE places.places (
  id VARCHAR(64) PRIMARY KEY REFERENCES core.entities(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(64) NOT NULL,
  address VARCHAR(255),
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  geom GEOGRAPHY(Point, 4326) GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)) STORED
);
CREATE INDEX gist_places_geom ON places.places USING GIST (geom);`,
      },
      {
        name: 'visits',
        schema_name: 'places',
        display_name: 'Place Visits Log',
        description: 'Chronological visits, ratings, dates, and companion check-ins.',
        row_count: db.visits.length,
        columns: [
          { name: 'id', type: 'varchar(64)', is_pk: true, is_fk: false, is_nullable: false },
          { name: 'place_id', type: 'varchar(64)', is_pk: false, is_fk: true, fk_target: 'places.places(id)', is_nullable: false },
          { name: 'visited_at', type: 'date', is_pk: false, is_fk: false, is_nullable: false },
          { name: 'rating', type: 'integer', is_pk: false, is_fk: false, is_nullable: false, default_value: '5' },
          { name: 'notes', type: 'text', is_pk: false, is_fk: false, is_nullable: true },
        ],
        foreign_keys: [
          { column: 'place_id', target_schema: 'places', target_table: 'places', target_column: 'id', constraint_name: 'fk_visits_place' },
        ],
        ddl: `CREATE TABLE places.visits (
  id VARCHAR(64) PRIMARY KEY,
  place_id VARCHAR(64) NOT NULL REFERENCES places.places(id) ON DELETE CASCADE,
  visited_at DATE NOT NULL,
  rating INTEGER NOT NULL DEFAULT 5,
  notes TEXT
);`,
      },
    ];

    schemas.push({
      name: 'places',
      display_name: 'Places & GIS Schema',
      category: 'domain',
      description: 'Spatial & Geographic domain: PostGIS Point geometries, addresses, spatial queries, and visit histories.',
      color: 'rose',
      icon: 'MapPin',
      total_tables: placesTables.length,
      total_rows: placesTables.reduce((sum, t) => sum + t.row_count, 0),
      tables: placesTables,
    });

    // 6. EVENTS SCHEMA
    const eventsTables: TableDefinition[] = [
      {
        name: 'events',
        schema_name: 'events',
        display_name: 'Scheduled Events',
        description: 'Calendar events, timestamps, intervals, and optional venue links.',
        row_count: db.events.size,
        columns: [
          { name: 'id', type: 'varchar(64)', is_pk: true, is_fk: true, fk_target: 'core.entities(id)', is_nullable: false },
          { name: 'title', type: 'varchar(255)', is_pk: false, is_fk: false, is_nullable: false },
          { name: 'description', type: 'text', is_pk: false, is_fk: false, is_nullable: true },
          { name: 'start_time', type: 'timestamp with time zone', is_pk: false, is_fk: false, is_nullable: false, indexes: ['btree_events_start_time'] },
          { name: 'end_time', type: 'timestamp with time zone', is_pk: false, is_fk: false, is_nullable: true },
          { name: 'is_all_day', type: 'boolean', is_pk: false, is_fk: false, is_nullable: false, default_value: 'false' },
          { name: 'place_id', type: 'varchar(64)', is_pk: false, is_fk: true, fk_target: 'places.places(id)', is_nullable: true },
        ],
        foreign_keys: [
          { column: 'id', target_schema: 'core', target_table: 'entities', target_column: 'id', constraint_name: 'fk_events_entity' },
          { column: 'place_id', target_schema: 'places', target_table: 'places', target_column: 'id', constraint_name: 'fk_events_place' },
        ],
        ddl: `CREATE TABLE events.events (
  id VARCHAR(64) PRIMARY KEY REFERENCES core.entities(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  is_all_day BOOLEAN NOT NULL DEFAULT false,
  place_id VARCHAR(64) REFERENCES places.places(id) ON DELETE SET NULL
);`,
      },
      {
        name: 'participants',
        schema_name: 'events',
        display_name: 'Event Participants',
        description: 'Participants, speakers, organizers, and attendance states.',
        row_count: db.participants.length,
        columns: [
          { name: 'id', type: 'varchar(64)', is_pk: true, is_fk: false, is_nullable: false },
          { name: 'event_id', type: 'varchar(64)', is_pk: false, is_fk: true, fk_target: 'events.events(id)', is_nullable: false },
          { name: 'person_id', type: 'varchar(64)', is_pk: false, is_fk: true, fk_target: 'people.persons(id)', is_nullable: false },
          { name: 'role', type: 'varchar(32)', is_pk: false, is_fk: false, is_nullable: false, default_value: "'attendee'" },
        ],
        foreign_keys: [
          { column: 'event_id', target_schema: 'events', target_table: 'events', target_column: 'id', constraint_name: 'fk_participants_event' },
          { column: 'person_id', target_schema: 'people', target_table: 'persons', target_column: 'id', constraint_name: 'fk_participants_person' },
        ],
        ddl: `CREATE TABLE events.participants (
  id VARCHAR(64) PRIMARY KEY,
  event_id VARCHAR(64) NOT NULL REFERENCES events.events(id) ON DELETE CASCADE,
  person_id VARCHAR(64) NOT NULL REFERENCES people.persons(id) ON DELETE CASCADE,
  role VARCHAR(32) NOT NULL DEFAULT 'attendee'
);`,
      },
    ];

    schemas.push({
      name: 'events',
      display_name: 'Events & Timeline Schema',
      category: 'domain',
      description: 'Temporal domain: chronological events, time intervals, participant attendance, and venue relations.',
      color: 'purple',
      icon: 'Calendar',
      total_tables: eventsTables.length,
      total_rows: eventsTables.reduce((sum, t) => sum + t.row_count, 0),
      tables: eventsTables,
    });

    // 7. KNOWLEDGE SCHEMA
    const knowledgeTables: TableDefinition[] = [
      {
        name: 'items',
        schema_name: 'knowledge',
        display_name: 'Knowledge Catalog Items',
        description: 'Dynamic schema items with JSONB custom property payload validated by Meta Layer.',
        row_count: db.knowledgeItems.size,
        columns: [
          { name: 'id', type: 'varchar(64)', is_pk: true, is_fk: true, fk_target: 'core.entities(id)', is_nullable: false },
          { name: 'entity_type_id', type: 'varchar(64)', is_pk: false, is_fk: true, fk_target: 'meta.entity_types(id)', is_nullable: false },
          { name: 'title', type: 'varchar(255)', is_pk: false, is_fk: false, is_nullable: false },
          { name: 'description', type: 'text', is_pk: false, is_fk: false, is_nullable: true },
          { name: 'notes', type: 'text', is_pk: false, is_fk: false, is_nullable: true },
          { name: 'properties', type: 'jsonb', is_pk: false, is_fk: false, is_nullable: false, indexes: ['gin_knowledge_properties'] },
        ],
        foreign_keys: [
          { column: 'id', target_schema: 'core', target_table: 'entities', target_column: 'id', constraint_name: 'fk_knowledge_entity' },
          { column: 'entity_type_id', target_schema: 'meta', target_table: 'entity_types', target_column: 'id', constraint_name: 'fk_knowledge_type' },
        ],
        ddl: `CREATE TABLE knowledge.items (
  id VARCHAR(64) PRIMARY KEY REFERENCES core.entities(id) ON DELETE CASCADE,
  entity_type_id VARCHAR(64) NOT NULL REFERENCES meta.entity_types(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  notes TEXT,
  properties JSONB NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX gin_knowledge_properties ON knowledge.items USING GIN (properties);`,
      },
    ];

    schemas.push({
      name: 'knowledge',
      display_name: 'Knowledge & JSONB Schema',
      category: 'domain',
      description: 'Polymorphic domain module utilizing PostgreSQL JSONB columns validated against Meta entity type definitions.',
      color: 'amber',
      icon: 'BookOpen',
      total_tables: knowledgeTables.length,
      total_rows: knowledgeTables.reduce((sum, t) => sum + t.row_count, 0),
      tables: knowledgeTables,
    });

    // 8. BUILDINGS SCHEMA
    const buildingsTables: TableDefinition[] = [
      {
        name: 'buildings',
        schema_name: 'buildings',
        display_name: 'Facility Buildings',
        description: 'Architectural structures, facility codes, gross area, and spatial site anchors.',
        row_count: db.buildings.size,
        columns: [
          { name: 'id', type: 'varchar(64)', is_pk: true, is_fk: true, fk_target: 'core.entities(id)', is_nullable: false },
          { name: 'name', type: 'varchar(255)', is_pk: false, is_fk: false, is_nullable: false },
          { name: 'code', type: 'varchar(32)', is_pk: false, is_fk: false, is_nullable: false },
          { name: 'building_type', type: 'varchar(64)', is_pk: false, is_fk: false, is_nullable: false },
          { name: 'place_id', type: 'varchar(64)', is_pk: false, is_fk: true, fk_target: 'places.places(id)', is_nullable: true },
          { name: 'total_floors', type: 'integer', is_pk: false, is_fk: false, is_nullable: false, default_value: '1' },
          { name: 'gross_area_sqm', type: 'numeric(10,2)', is_pk: false, is_fk: false, is_nullable: true },
        ],
        foreign_keys: [
          { column: 'id', target_schema: 'core', target_table: 'entities', target_column: 'id', constraint_name: 'fk_buildings_entity' },
          { column: 'place_id', target_schema: 'places', target_table: 'places', target_column: 'id', constraint_name: 'fk_buildings_place' },
        ],
        ddl: `CREATE TABLE buildings.buildings (
  id VARCHAR(64) PRIMARY KEY REFERENCES core.entities(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(32) NOT NULL,
  building_type VARCHAR(64) NOT NULL,
  place_id VARCHAR(64) REFERENCES places.places(id) ON DELETE SET NULL,
  total_floors INTEGER NOT NULL DEFAULT 1,
  gross_area_sqm NUMERIC(10,2)
);`,
      },
    ];

    schemas.push({
      name: 'buildings',
      display_name: 'Buildings & Facilities Schema',
      category: 'domain',
      description: 'Demonstrates modular extensibility: physical structures, spatial links, and asset hierarchy.',
      color: 'sky',
      icon: 'Building2',
      total_tables: buildingsTables.length,
      total_rows: buildingsTables.reduce((sum, t) => sum + t.row_count, 0),
      tables: buildingsTables,
    });

    return schemas;
  }

  public getTableRecords(dbId: string, schemaName: string, tableName: string): any[] {
    const db = this.getDatabaseInstance(dbId);
    switch (`${schemaName}.${tableName}`) {
      case 'core.users':
        return Array.from(db.users.values());
      case 'core.roles':
        return Array.from(db.roles.values());
      case 'core.entities':
        return Array.from(db.entities.values());
      case 'core.modules':
        return Array.from(db.modules.values());
      case 'core.audit_log':
        return db.auditLog;
      case 'meta.entity_types':
        return Array.from(db.entityTypes.values());
      case 'meta.property_definitions':
        return Array.from(db.propertyDefinitions.values());
      case 'shared.tags':
        return Array.from(db.tags.values());
      case 'shared.entity_tags':
        return db.entityTags;
      case 'shared.link_types':
        return Array.from(db.linkTypes.values());
      case 'shared.links':
        return db.links;
      case 'people.persons':
        return Array.from(db.people.values());
      case 'people.contacts':
        return Array.from(db.contacts.values());
      case 'places.places':
        return Array.from(db.places.values());
      case 'places.visits':
        return db.visits;
      case 'events.events':
        return Array.from(db.events.values());
      case 'events.participants':
        return db.participants;
      case 'knowledge.items':
        return Array.from(db.knowledgeItems.values());
      case 'buildings.buildings':
        return Array.from(db.buildings.values());
      default:
        return [];
    }
  }
}

export const dbManager = new DatabaseManager();
