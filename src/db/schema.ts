import { relations } from 'drizzle-orm';
import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  doublePrecision,
} from 'drizzle-orm/pg-core';

// ==============================================================================
// 1. Core Schema Tables (Authentication, Access Control, Entities, Audit, Modules)
// ==============================================================================

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  username: text('username').notNull().unique(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  fullName: text('full_name').notNull(),
  avatarUrl: text('avatar_url'),
  roleId: text('role_id').notNull().default('member'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow(),
  lastLogin: timestamp('last_login'),
});

export const roles = pgTable('roles', {
  id: text('id').primaryKey(), // 'admin', 'member', 'guest'
  name: text('name').notNull(),
  description: text('description').notNull(),
  isAdmin: boolean('is_admin').notNull().default(false),
});

export const rolePermissions = pgTable('role_permissions', {
  id: text('id').primaryKey(),
  roleId: text('role_id').notNull(),
  permissionKey: text('permission_key').notNull(),
  allowed: boolean('allowed').notNull().default(true),
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
  entityType: text('entity_type').notNull(), // 'person', 'place', 'event', 'knowledge_item', 'building'
  title: text('title').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  createdBy: text('created_by'),
});

export const modules = pgTable('modules', {
  id: text('id').primaryKey(), // 'people', 'places', 'events', 'knowledge', 'buildings'
  name: text('name').notNull(),
  description: text('description').notNull(),
  icon: text('icon').notNull(),
  isEnabled: boolean('is_enabled').notNull().default(true),
  version: text('version').notNull().default('1.0.0'),
  requiredExtensions: jsonb('required_extensions').$type<string[]>().default([]),
});

export const auditLogs = pgTable('audit_logs', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  username: text('username').notNull(),
  action: text('action').notNull(), // 'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'CONFIG_CHANGE', 'EXTENSION_TOGGLE'
  entityId: text('entity_id'),
  entityType: text('entity_type'),
  details: text('details').notNull(),
  metadata: jsonb('metadata'),
  timestamp: timestamp('timestamp').defaultNow(),
});

// ==============================================================================
// 2. Meta Schema Tables (Dynamic Schemas, Property Definitions & Groups)
// ==============================================================================

export const metaEntityTypes = pgTable('meta_entity_types', {
  id: text('id').primaryKey(), // 'book', 'hardware', 'recipe', 'software', 'custom'
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  icon: text('icon').notNull(),
  description: text('description'),
  schemaVersion: integer('schema_version').notNull().default(1),
});

export const metaPropertyGroups = pgTable('meta_property_groups', {
  id: text('id').primaryKey(),
  entityTypeId: text('entity_type_id').notNull(),
  name: text('name').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
});

export const metaPropertyDefinitions = pgTable('meta_property_definitions', {
  id: text('id').primaryKey(),
  entityTypeId: text('entity_type_id').notNull(),
  code: text('code').notNull(),
  label: text('label').notNull(),
  dataType: text('data_type').notNull(), // 'string', 'number', 'boolean', 'date', 'select', 'textarea', 'tags'
  isRequired: boolean('is_required').notNull().default(false),
  sortOrder: integer('sort_order').notNull().default(0),
  enumValues: jsonb('enum_values').$type<string[]>(),
  groupId: text('group_id'),
  defaultValue: jsonb('default_value'),
});

// ==============================================================================
// 3. Shared Schema Tables (Tags, Cross-Domain Links, Files)
// ==============================================================================

export const sharedTags = pgTable('shared_tags', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  color: text('color').notNull().default('#3b82f6'),
  icon: text('icon'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const sharedEntityTags = pgTable('shared_entity_tags', {
  id: text('id').primaryKey(),
  entityId: text('entity_id').notNull(),
  tagId: text('tag_id').notNull(),
});

export const sharedLinkTypes = pgTable('shared_link_types', {
  id: text('id').primaryKey(),
  code: text('code').notNull().unique(),
  forwardLabel: text('forward_label').notNull(),
  reverseLabel: text('reverse_label').notNull(),
});

export const sharedLinks = pgTable('shared_links', {
  id: text('id').primaryKey(),
  sourceEntityId: text('source_entity_id').notNull(),
  targetEntityId: text('target_entity_id').notNull(),
  linkTypeId: text('link_type_id').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const sharedFiles = pgTable('shared_files', {
  id: text('id').primaryKey(),
  filename: text('filename').notNull(),
  fileSize: integer('file_size').notNull(),
  mimeType: text('mime_type').notNull(),
  fileUrl: text('file_url').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const sharedEntityFiles = pgTable('shared_entity_files', {
  id: text('id').primaryKey(),
  entityId: text('entity_id').notNull(),
  fileId: text('file_id').notNull(),
  role: text('role').notNull().default('attachment'), // 'attachment', 'cover', 'avatar', 'document'
});

// ==============================================================================
// 4. Domain Schema Tables (People, Places, Events, Knowledge, Buildings)
// ==============================================================================

// 4.1 People Domain
export const people = pgTable('people', {
  id: text('id').primaryKey(), // Foreign key to entities.id
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  nickname: text('nickname'),
  birthdate: text('birthdate'),
  bio: text('bio'),
  avatarUrl: text('avatar_url'),
  gender: text('gender'),
  company: text('company'),
  roleTitle: text('role_title'),
  notes: text('notes'),
  customProperties: jsonb('custom_properties'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const peopleContacts = pgTable('people_contacts', {
  id: text('id').primaryKey(),
  personId: text('person_id').notNull(),
  type: text('type').notNull(), // 'email', 'phone', 'telegram', 'website', 'address', 'github', 'linkedin'
  value: text('value').notNull(),
  label: text('label').notNull(),
  isPrimary: boolean('is_primary').notNull().default(false),
});

export const peopleRelationships = pgTable('people_relationships', {
  id: text('id').primaryKey(),
  personAId: text('person_a_id').notNull(),
  personBId: text('person_b_id').notNull(),
  relationshipType: text('relationship_type').notNull(),
  notes: text('notes'),
});

// 4.2 Places Domain
export const places = pgTable('places', {
  id: text('id').primaryKey(), // Foreign key to entities.id
  name: text('name').notNull(),
  category: text('category').notNull().default('Other'), // 'Home', 'Work', 'Travel', 'Restaurant', 'Outdoors', 'Cultural', 'Facility', 'Other'
  address: text('address'),
  latitude: doublePrecision('latitude').notNull(),
  longitude: doublePrecision('longitude').notNull(),
  altitude: doublePrecision('altitude'),
  description: text('description'),
  openingHours: text('opening_hours'),
  website: text('website'),
  phone: text('phone'),
  notes: text('notes'),
  customProperties: jsonb('custom_properties'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const placesVisits = pgTable('places_visits', {
  id: text('id').primaryKey(),
  placeId: text('place_id').notNull(),
  visitedAt: timestamp('visited_at').notNull(),
  rating: integer('rating'), // 1 to 5
  notes: text('notes'),
  photos: jsonb('photos').$type<string[]>(),
});

// 4.3 Events Domain
export const events = pgTable('events', {
  id: text('id').primaryKey(), // Foreign key to entities.id
  title: text('title').notNull(),
  description: text('description'),
  startTime: text('start_time').notNull(),
  endTime: text('end_time'),
  isAllDay: boolean('is_all_day').notNull().default(false),
  placeId: text('place_id'),
  status: text('status').notNull().default('planned'), // 'planned', 'in_progress', 'completed', 'cancelled'
  recurrence: text('recurrence').notNull().default('none'), // 'none', 'daily', 'weekly', 'monthly', 'yearly'
  customProperties: jsonb('custom_properties'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const eventsParticipants = pgTable('events_participants', {
  id: text('id').primaryKey(),
  eventId: text('event_id').notNull(),
  personId: text('person_id').notNull(),
  role: text('role').notNull().default('attendee'), // 'organizer', 'attendee', 'speaker', 'guest'
  status: text('status').notNull().default('confirmed'), // 'confirmed', 'tentative', 'declined'
});

// 4.4 Knowledge Domain
export const knowledgeItems = pgTable('knowledge_items', {
  id: text('id').primaryKey(), // Foreign key to entities.id
  entityTypeId: text('entity_type_id').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  notes: text('notes'),
  properties: jsonb('properties').notNull().default({}),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 4.5 Buildings Domain
export const buildings = pgTable('buildings', {
  id: text('id').primaryKey(), // Foreign key to entities.id
  name: text('name').notNull(),
  code: text('code').notNull().unique(),
  buildingType: text('building_type').notNull().default('Commercial'),
  address: text('address'),
  placeId: text('place_id'),
  managerPersonId: text('manager_person_id'),
  floorsCount: integer('floors_count').notNull().default(1),
  totalAreaSqm: doublePrecision('total_area_sqm').notNull().default(0),
  notes: text('notes'),
  customProperties: jsonb('custom_properties'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ==============================================================================
// 5. Technical Extensions Table
// ==============================================================================

export const technicalExtensions = pgTable('technical_extensions', {
  id: text('id').primaryKey(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  type: text('type').notNull().default('atomic'), // 'composite' | 'atomic'
  description: text('description').notNull(),
  isEnabled: boolean('is_enabled').notNull().default(true),
  version: text('version').notNull().default('1.0.0'),
  subComponents: jsonb('sub_components').$type<string[]>(),
  parentExtension: text('parent_extension'),
  status: text('status').notNull().default('active'), // 'active' | 'disabled' | 'error'
});

// ==============================================================================
// Relations Definitions
// ==============================================================================

export const usersRelations = relations(users, ({ one, many }) => ({
  role: one(roles, {
    fields: [users.roleId],
    references: [roles.id],
  }),
  auditLogs: many(auditLogs),
  sessions: many(sessions),
}));

export const rolesRelations = relations(roles, ({ many }) => ({
  users: many(users),
  permissions: many(rolePermissions),
}));

export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
  role: one(roles, {
    fields: [rolePermissions.roleId],
    references: [roles.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}));

export const entitiesRelations = relations(entities, ({ many }) => ({
  tags: many(sharedEntityTags),
  outgoingLinks: many(sharedLinks, { relationName: 'sourceEntity' }),
  incomingLinks: many(sharedLinks, { relationName: 'targetEntity' }),
  files: many(sharedEntityFiles),
}));

export const metaEntityTypesRelations = relations(metaEntityTypes, ({ many }) => ({
  propertyGroups: many(metaPropertyGroups),
  propertyDefinitions: many(metaPropertyDefinitions),
  knowledgeItems: many(knowledgeItems),
}));

export const metaPropertyGroupsRelations = relations(metaPropertyGroups, ({ one, many }) => ({
  entityType: one(metaEntityTypes, {
    fields: [metaPropertyGroups.entityTypeId],
    references: [metaEntityTypes.id],
  }),
  properties: many(metaPropertyDefinitions),
}));

export const metaPropertyDefinitionsRelations = relations(metaPropertyDefinitions, ({ one }) => ({
  entityType: one(metaEntityTypes, {
    fields: [metaPropertyDefinitions.entityTypeId],
    references: [metaEntityTypes.id],
  }),
  group: one(metaPropertyGroups, {
    fields: [metaPropertyDefinitions.groupId],
    references: [metaPropertyGroups.id],
  }),
}));

export const sharedTagsRelations = relations(sharedTags, ({ many }) => ({
  entities: many(sharedEntityTags),
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

export const sharedLinksRelations = relations(sharedLinks, ({ one }) => ({
  sourceEntity: one(entities, {
    fields: [sharedLinks.sourceEntityId],
    references: [entities.id],
    relationName: 'sourceEntity',
  }),
  targetEntity: one(entities, {
    fields: [sharedLinks.targetEntityId],
    references: [entities.id],
    relationName: 'targetEntity',
  }),
  linkType: one(sharedLinkTypes, {
    fields: [sharedLinks.linkTypeId],
    references: [sharedLinkTypes.id],
  }),
}));

export const sharedEntityFilesRelations = relations(sharedEntityFiles, ({ one }) => ({
  entity: one(entities, {
    fields: [sharedEntityFiles.entityId],
    references: [entities.id],
  }),
  file: one(sharedFiles, {
    fields: [sharedEntityFiles.fileId],
    references: [sharedFiles.id],
  }),
}));

export const peopleRelations = relations(people, ({ one, many }) => ({
  entity: one(entities, {
    fields: [people.id],
    references: [entities.id],
  }),
  contacts: many(peopleContacts),
  relationshipsOut: many(peopleRelationships, { relationName: 'personA' }),
  relationshipsIn: many(peopleRelationships, { relationName: 'personB' }),
  eventParticipations: many(eventsParticipants),
}));

export const peopleContactsRelations = relations(peopleContacts, ({ one }) => ({
  person: one(people, {
    fields: [peopleContacts.personId],
    references: [people.id],
  }),
}));

export const placesRelations = relations(places, ({ one, many }) => ({
  entity: one(entities, {
    fields: [places.id],
    references: [entities.id],
  }),
  visits: many(placesVisits),
  events: many(events),
  buildings: many(buildings),
}));

export const placesVisitsRelations = relations(placesVisits, ({ one }) => ({
  place: one(places, {
    fields: [placesVisits.placeId],
    references: [places.id],
  }),
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
  entity: one(entities, {
    fields: [events.id],
    references: [entities.id],
  }),
  place: one(places, {
    fields: [events.placeId],
    references: [places.id],
  }),
  participants: many(eventsParticipants),
}));

export const eventsParticipantsRelations = relations(eventsParticipants, ({ one }) => ({
  event: one(events, {
    fields: [eventsParticipants.eventId],
    references: [events.id],
  }),
  person: one(people, {
    fields: [eventsParticipants.personId],
    references: [people.id],
  }),
}));

export const knowledgeItemsRelations = relations(knowledgeItems, ({ one }) => ({
  entity: one(entities, {
    fields: [knowledgeItems.id],
    references: [entities.id],
  }),
  entityType: one(metaEntityTypes, {
    fields: [knowledgeItems.entityTypeId],
    references: [metaEntityTypes.id],
  }),
}));

export const buildingsRelations = relations(buildings, ({ one }) => ({
  entity: one(entities, {
    fields: [buildings.id],
    references: [entities.id],
  }),
  place: one(places, {
    fields: [buildings.placeId],
    references: [places.id],
  }),
  manager: one(people, {
    fields: [buildings.managerPersonId],
    references: [people.id],
  }),
}));
