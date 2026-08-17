import { relations } from 'drizzle-orm';
import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  doublePrecision,
} from 'drizzle-orm/pg-core';

// -------------------------------------------------------------
// 1. Core Schema Tables
// -------------------------------------------------------------

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID / Core User ID
  username: text('username').notNull(),
  email: text('email').notNull(),
  fullName: text('full_name'),
  avatarUrl: text('avatar_url'),
  roleId: text('role_id').default('member'), // admin, member, guest
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  lastLogin: timestamp('last_login'),
});

export const roles = pgTable('roles', {
  id: text('id').primaryKey(), // admin, member, guest
  name: text('name').notNull(),
  description: text('description').notNull(),
  isAdmin: boolean('is_admin').default(false),
});

export const rolePermissions = pgTable('role_permissions', {
  id: serial('id').primaryKey(),
  roleId: text('role_id').notNull(),
  permissionKey: text('permission_key').notNull(),
  allowed: boolean('allowed').default(true),
});

export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  token: text('token').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  expiresAt: timestamp('expires_at').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
});

export const settings = pgTable('settings', {
  key: text('key').primaryKey(),
  value: jsonb('value').notNull(),
  description: text('description'),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const entities = pgTable('entities', {
  id: text('id').primaryKey(),
  entityType: text('entity_type').notNull(), // person, place, event, knowledge_item, building
  title: text('title').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  createdBy: text('created_by'),
});

export const modules = pgTable('modules', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  icon: text('icon').notNull(),
  isEnabled: boolean('is_enabled').default(true),
  version: text('version').default('1.0.0'),
  requiredExtensions: jsonb('required_extensions').$type<string[]>().default([]),
});

export const auditLogs = pgTable('audit_logs', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  username: text('username').notNull(),
  action: text('action').notNull(),
  entityId: text('entity_id'),
  entityType: text('entity_type'),
  details: text('details').notNull(),
  metadata: jsonb('metadata'),
  timestamp: timestamp('timestamp').defaultNow(),
});

// -------------------------------------------------------------
// 2. Meta Schema Tables (Dynamic Schemas & Properties)
// -------------------------------------------------------------

export const metaEntityTypes = pgTable('meta_entity_types', {
  id: text('id').primaryKey(), // book, hardware, recipe, etc.
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  icon: text('icon').notNull(),
  description: text('description'),
  schemaVersion: integer('schema_version').default(1),
});

export const metaPropertyDefinitions = pgTable('meta_property_definitions', {
  id: text('id').primaryKey(),
  entityTypeId: text('entity_type_id').notNull(),
  code: text('code').notNull(),
  name: text('name').notNull(),
  dataType: text('data_type').notNull(), // string, number, boolean, date, json, select
  isRequired: boolean('is_required').default(false),
  options: jsonb('options'),
  groupId: text('group_id'),
  sortOrder: integer('sort_order').default(0),
});

// -------------------------------------------------------------
// 3. Shared Schema Tables (Tags, Cross-Domain Links, Files)
// -------------------------------------------------------------

export const sharedTags = pgTable('shared_tags', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  color: text('color').default('#3b82f6'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const sharedEntityTags = pgTable('shared_entity_tags', {
  id: serial('id').primaryKey(),
  entityId: text('entity_id').notNull(),
  tagId: text('tag_id').notNull(),
});

export const sharedLinks = pgTable('shared_links', {
  id: text('id').primaryKey(),
  sourceEntityId: text('source_entity_id').notNull(),
  targetEntityId: text('target_entity_id').notNull(),
  linkTypeId: text('link_type_id').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

// -------------------------------------------------------------
// 4. Domain Schema Tables (People, Places, Events, Knowledge, Buildings)
// -------------------------------------------------------------

export const people = pgTable('people', {
  id: text('id').primaryKey(), // matches entities.id
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  nickname: text('nickname'),
  birthDate: text('birth_date'),
  avatarUrl: text('avatar_url'),
  notes: text('notes'),
  customProperties: jsonb('custom_properties'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const places = pgTable('places', {
  id: text('id').primaryKey(), // matches entities.id
  name: text('name').notNull(),
  address: text('address'),
  city: text('city'),
  country: text('country'),
  latitude: doublePrecision('latitude'),
  longitude: doublePrecision('longitude'),
  category: text('category').default('general'),
  rating: integer('rating'),
  notes: text('notes'),
  customProperties: jsonb('custom_properties'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const events = pgTable('events', {
  id: text('id').primaryKey(), // matches entities.id
  title: text('title').notNull(),
  description: text('description'),
  startDate: text('start_date').notNull(),
  endDate: text('end_date'),
  locationId: text('location_id'),
  eventType: text('event_type').default('general'),
  status: text('status').default('confirmed'),
  customProperties: jsonb('custom_properties'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const knowledgeItems = pgTable('knowledge_items', {
  id: text('id').primaryKey(), // matches entities.id
  title: text('title').notNull(),
  content: text('content').notNull(),
  itemType: text('item_type').default('note'), // note, snippet, guide, doc
  summary: text('summary'),
  customProperties: jsonb('custom_properties'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const buildings = pgTable('buildings', {
  id: text('id').primaryKey(), // matches entities.id
  name: text('name').notNull(),
  buildingType: text('building_type').default('commercial'),
  floorsCount: integer('floors_count').default(1),
  totalAreaSqm: doublePrecision('total_area_sqm'),
  address: text('address'),
  latitude: doublePrecision('latitude'),
  longitude: doublePrecision('longitude'),
  yearBuilt: integer('year_built'),
  notes: text('notes'),
  customProperties: jsonb('custom_properties'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// -------------------------------------------------------------
// Relations
// -------------------------------------------------------------

export const usersRelations = relations(users, ({ many }) => ({
  auditLogs: many(auditLogs),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.uid],
  }),
}));

export const entitiesRelations = relations(entities, ({ many }) => ({
  tags: many(sharedEntityTags),
  outgoingLinks: many(sharedLinks, { relationName: 'sourceEntity' }),
  incomingLinks: many(sharedLinks, { relationName: 'targetEntity' }),
}));

export const sharedEntityTagsRelations = relations(sharedEntityTags, ({ one }) => ({
  entity: one(entities, {
    fields: [sharedEntityTags.entityId],
    references: [entities.id],
  }),
  tag: one(sharedTags, {
    fields: [sharedEntityTags.tagId],
    references: [sharedTags.id],
  }),
}));
