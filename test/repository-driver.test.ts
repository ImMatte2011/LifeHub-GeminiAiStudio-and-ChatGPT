import assert from 'node:assert/strict';
import { RepositoryManager } from '../server/repositories/index.js';
import {
  PostgresUserRepository,
  PostgresRoleRepository,
  PostgresEntityRepository,
  PostgresMetaRepository,
  PostgresSharedRepository,
  PostgresPeopleRepository,
  PostgresPlacesRepository,
  PostgresEventsRepository,
  PostgresKnowledgeRepository,
  PostgresBuildingsRepository,
  PostgresAuditRepository,
  PostgresSettingsRepository,
  PostgresExtensionsRepository,
} from '../server/repositories/postgres/PostgresRepository.js';
import {
  MemoryUserRepository,
  MemoryRoleRepository,
  MemoryEntityRepository,
  MemoryMetaRepository,
  MemorySharedRepository,
  MemoryPeopleRepository,
  MemoryPlacesRepository,
  MemoryEventsRepository,
  MemoryKnowledgeRepository,
  MemoryBuildingsRepository,
  MemoryAuditRepository,
  MemorySettingsRepository,
  MemoryExtensionsRepository,
} from '../server/repositories/memory/MemoryRepository.js';

console.log('======================================================');
console.log('  LifeHub Repository Driver & Adapter Test Suite');
console.log('======================================================');

// Test 1: Memory Driver instantiates Memory Repositories
{
  const mgr = new RepositoryManager('memory');
  assert.equal(mgr.getActiveDriver(), 'memory');
  assert.ok(mgr.users instanceof MemoryUserRepository);
  assert.ok(mgr.roles instanceof MemoryRoleRepository);
  assert.ok(mgr.entities instanceof MemoryEntityRepository);
  assert.ok(mgr.meta instanceof MemoryMetaRepository);
  assert.ok(mgr.shared instanceof MemorySharedRepository);
  assert.ok(mgr.people instanceof MemoryPeopleRepository);
  assert.ok(mgr.places instanceof MemoryPlacesRepository);
  assert.ok(mgr.events instanceof MemoryEventsRepository);
  assert.ok(mgr.knowledge instanceof MemoryKnowledgeRepository);
  assert.ok(mgr.buildings instanceof MemoryBuildingsRepository);
  assert.ok(mgr.audit instanceof MemoryAuditRepository);
  assert.ok(mgr.settings instanceof MemorySettingsRepository);
  assert.ok(mgr.extensions instanceof MemoryExtensionsRepository);
  console.log('  ✓ 1. PERSISTENCE_DRIVER=memory instantiates all MemoryRepository adapters');
}

// Test 2: Postgres Driver instantiates Postgres Repositories for all domains
{
  const mgr = new RepositoryManager('postgres');
  assert.equal(mgr.getActiveDriver(), 'postgres');
  assert.ok(mgr.users instanceof PostgresUserRepository);
  assert.ok(mgr.roles instanceof PostgresRoleRepository);
  assert.ok(mgr.entities instanceof PostgresEntityRepository);
  assert.ok(mgr.meta instanceof PostgresMetaRepository);
  assert.ok(mgr.shared instanceof PostgresSharedRepository);
  assert.ok(mgr.people instanceof PostgresPeopleRepository);
  assert.ok(mgr.places instanceof PostgresPlacesRepository);
  assert.ok(mgr.events instanceof PostgresEventsRepository);
  assert.ok(mgr.knowledge instanceof PostgresKnowledgeRepository);
  assert.ok(mgr.buildings instanceof PostgresBuildingsRepository);
  assert.ok(mgr.audit instanceof PostgresAuditRepository);
  assert.ok(mgr.settings instanceof PostgresSettingsRepository);
  assert.ok(mgr.extensions instanceof PostgresExtensionsRepository);
  console.log('  ✓ 2. PERSISTENCE_DRIVER=postgres instantiates all PostgresRepository adapters');
}

// Test 3: Interface contract conformity
{
  const pgMgr = new RepositoryManager('postgres');
  
  // Verify method existence on role repository
  assert.equal(typeof pgMgr.roles.getAllRoles, 'function');
  assert.equal(typeof pgMgr.roles.getRoleById, 'function');
  assert.equal(typeof pgMgr.roles.getPermissionsForRole, 'function');
  assert.equal(typeof pgMgr.roles.setPermission, 'function');

  // Verify method existence on meta repository
  assert.equal(typeof pgMgr.meta.getEntityTypes, 'function');
  assert.equal(typeof pgMgr.meta.getEntityTypeById, 'function');
  assert.equal(typeof pgMgr.meta.getEntityTypeByCode, 'function');
  assert.equal(typeof pgMgr.meta.createEntityType, 'function');
  assert.equal(typeof pgMgr.meta.updateEntityType, 'function');
  assert.equal(typeof pgMgr.meta.deleteEntityType, 'function');
  assert.equal(typeof pgMgr.meta.getPropertyDefinitions, 'function');
  assert.equal(typeof pgMgr.meta.getPropertyDefinitionById, 'function');
  assert.equal(typeof pgMgr.meta.createPropertyDefinition, 'function');
  assert.equal(typeof pgMgr.meta.updatePropertyDefinition, 'function');
  assert.equal(typeof pgMgr.meta.deletePropertyDefinition, 'function');
  assert.equal(typeof pgMgr.meta.getPropertyGroups, 'function');
  assert.equal(typeof pgMgr.meta.createPropertyGroup, 'function');
  assert.equal(typeof pgMgr.meta.deletePropertyGroup, 'function');

  // Verify method existence on shared repository
  assert.equal(typeof pgMgr.shared.getTags, 'function');
  assert.equal(typeof pgMgr.shared.getTagById, 'function');
  assert.equal(typeof pgMgr.shared.createTag, 'function');
  assert.equal(typeof pgMgr.shared.deleteTag, 'function');
  assert.equal(typeof pgMgr.shared.getEntityTags, 'function');
  assert.equal(typeof pgMgr.shared.setEntityTags, 'function');
  assert.equal(typeof pgMgr.shared.getLinkTypes, 'function');
  assert.equal(typeof pgMgr.shared.createLinkType, 'function');
  assert.equal(typeof pgMgr.shared.getLinks, 'function');
  assert.equal(typeof pgMgr.shared.createLink, 'function');
  assert.equal(typeof pgMgr.shared.deleteLink, 'function');
  assert.equal(typeof pgMgr.shared.getFiles, 'function');
  assert.equal(typeof pgMgr.shared.createFile, 'function');
  assert.equal(typeof pgMgr.shared.getEntityFiles, 'function');
  assert.equal(typeof pgMgr.shared.linkFileToEntity, 'function');

  // Verify method existence on people repository
  assert.equal(typeof pgMgr.people.getAll, 'function');
  assert.equal(typeof pgMgr.people.getById, 'function');
  assert.equal(typeof pgMgr.people.create, 'function');
  assert.equal(typeof pgMgr.people.update, 'function');
  assert.equal(typeof pgMgr.people.delete, 'function');
  assert.equal(typeof pgMgr.people.getContacts, 'function');
  assert.equal(typeof pgMgr.people.addContact, 'function');
  assert.equal(typeof pgMgr.people.deleteContact, 'function');
  assert.equal(typeof pgMgr.people.getRelationships, 'function');
  assert.equal(typeof pgMgr.people.addRelationship, 'function');
  assert.equal(typeof pgMgr.people.deleteRelationship, 'function');

  // Verify method existence on places repository
  assert.equal(typeof pgMgr.places.getAll, 'function');
  assert.equal(typeof pgMgr.places.getById, 'function');
  assert.equal(typeof pgMgr.places.create, 'function');
  assert.equal(typeof pgMgr.places.update, 'function');
  assert.equal(typeof pgMgr.places.delete, 'function');
  assert.equal(typeof pgMgr.places.getVisits, 'function');
  assert.equal(typeof pgMgr.places.addVisit, 'function');
  assert.equal(typeof pgMgr.places.deleteVisit, 'function');

  // Verify method existence on events repository
  assert.equal(typeof pgMgr.events.getAll, 'function');
  assert.equal(typeof pgMgr.events.getById, 'function');
  assert.equal(typeof pgMgr.events.create, 'function');
  assert.equal(typeof pgMgr.events.update, 'function');
  assert.equal(typeof pgMgr.events.delete, 'function');
  assert.equal(typeof pgMgr.events.getParticipants, 'function');
  assert.equal(typeof pgMgr.events.addParticipant, 'function');
  assert.equal(typeof pgMgr.events.removeParticipant, 'function');

  // Verify method existence on knowledge repository
  assert.equal(typeof pgMgr.knowledge.getAll, 'function');
  assert.equal(typeof pgMgr.knowledge.getById, 'function');
  assert.equal(typeof pgMgr.knowledge.getByEntityType, 'function');
  assert.equal(typeof pgMgr.knowledge.create, 'function');
  assert.equal(typeof pgMgr.knowledge.update, 'function');
  assert.equal(typeof pgMgr.knowledge.delete, 'function');

  // Verify method existence on buildings repository
  assert.equal(typeof pgMgr.buildings.getAll, 'function');
  assert.equal(typeof pgMgr.buildings.getById, 'function');
  assert.equal(typeof pgMgr.buildings.create, 'function');
  assert.equal(typeof pgMgr.buildings.update, 'function');
  assert.equal(typeof pgMgr.buildings.delete, 'function');

  // Verify method existence on settings repository
  assert.equal(typeof pgMgr.settings.get, 'function');
  assert.equal(typeof pgMgr.settings.set, 'function');
  assert.equal(typeof pgMgr.settings.getAll, 'function');

  // Verify method existence on extensions repository
  assert.equal(typeof pgMgr.extensions.getAll, 'function');
  assert.equal(typeof pgMgr.extensions.getByCode, 'function');
  assert.equal(typeof pgMgr.extensions.toggle, 'function');

  console.log('  ✓ 3. All PostgreSQL repository adapters implement required interface contracts');
}

console.log('------------------------------------------------------');
console.log('  All Repository Driver Tests Passed Successfully');
console.log('------------------------------------------------------');
