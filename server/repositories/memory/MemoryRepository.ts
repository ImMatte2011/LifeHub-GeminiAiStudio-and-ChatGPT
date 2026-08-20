import { LifeHubDatabase, db as defaultDb } from '../../db/database.js';
import {
  CoreUser,
  CoreRole,
  CoreRolePermission,
  CoreEntity,
  CoreAuditLog,
  CoreSetting,
  MetaEntityType,
  MetaPropertyDefinition,
  MetaPropertyGroup,
  SharedTag,
  SharedLinkType,
  SharedLink,
  SharedFile,
  SharedEntityFile,
  PeoplePerson,
  PeopleContact,
  PeopleRelationship,
  PlacesPlace,
  PlacesVisit,
  EventsEvent,
  EventsParticipant,
  KnowledgeItem,
  BuildingsBuilding,
  TechnicalExtension,
} from '../../db/types.js';
import {
  IUserRepository,
  IRoleRepository,
  IEntityRepository,
  IMetaRepository,
  ISharedRepository,
  IPeopleRepository,
  IPlacesRepository,
  IEventsRepository,
  IKnowledgeRepository,
  IBuildingsRepository,
  IAuditRepository,
  ISettingsRepository,
  IExtensionsRepository,
} from '../interfaces.js';

export class MemoryUserRepository implements IUserRepository {
  constructor(private db: LifeHubDatabase = defaultDb) {}

  async getById(id: string): Promise<CoreUser | null> {
    return this.db.users.get(id) || null;
  }

  async getByUsername(username: string): Promise<CoreUser | null> {
    for (const u of this.db.users.values()) {
      if (u.username.toLowerCase() === username.toLowerCase()) return u;
    }
    return null;
  }

  async getByEmail(email: string): Promise<CoreUser | null> {
    for (const u of this.db.users.values()) {
      if (u.email.toLowerCase() === email.toLowerCase()) return u;
    }
    return null;
  }

  async getAll(): Promise<CoreUser[]> {
    return Array.from(this.db.users.values());
  }

  async create(user: CoreUser): Promise<CoreUser> {
    this.db.users.set(user.id, user);
    this.db.saveToDisk();
    return user;
  }

  async update(id: string, updates: Partial<CoreUser>): Promise<CoreUser | null> {
    const user = this.db.users.get(id);
    if (!user) return null;
    Object.assign(user, updates);
    this.db.saveToDisk();
    return user;
  }

  async delete(id: string): Promise<boolean> {
    const deleted = this.db.users.delete(id);
    if (deleted) this.db.saveToDisk();
    return deleted;
  }
}

export class MemoryRoleRepository implements IRoleRepository {
  constructor(private db: LifeHubDatabase = defaultDb) {}

  async getAllRoles(): Promise<CoreRole[]> {
    return Array.from(this.db.roles.values());
  }

  async getRoleById(id: string): Promise<CoreRole | null> {
    return this.db.roles.get(id) || null;
  }

  async getPermissionsForRole(roleId: string): Promise<CoreRolePermission[]> {
    return Array.from(this.db.rolePermissions.values()).filter((p) => p.role_id === roleId);
  }

  async setPermission(roleId: string, permissionKey: string, allowed: boolean): Promise<CoreRolePermission> {
    const id = `perm_${roleId}_${permissionKey}`;
    const perm: CoreRolePermission = {
      id,
      role_id: roleId,
      permission_key: permissionKey,
      allowed,
    };
    this.db.rolePermissions.set(id, perm);
    this.db.saveToDisk();
    return perm;
  }
}

export class MemoryEntityRepository implements IEntityRepository {
  constructor(private db: LifeHubDatabase = defaultDb) {}

  async getById(id: string): Promise<CoreEntity | null> {
    return this.db.entities.get(id) || null;
  }

  async getByType(type: string): Promise<CoreEntity[]> {
    return Array.from(this.db.entities.values()).filter((e) => e.entity_type === type);
  }

  async getAll(): Promise<CoreEntity[]> {
    return Array.from(this.db.entities.values());
  }

  async create(entity: CoreEntity): Promise<CoreEntity> {
    this.db.entities.set(entity.id, entity);
    this.db.saveToDisk();
    return entity;
  }

  async update(id: string, updates: Partial<CoreEntity>): Promise<CoreEntity | null> {
    const entity = this.db.entities.get(id);
    if (!entity) return null;
    Object.assign(entity, updates, { updated_at: new Date().toISOString() });
    this.db.saveToDisk();
    return entity;
  }

  async delete(id: string): Promise<boolean> {
    const deleted = this.db.entities.delete(id);
    if (deleted) this.db.saveToDisk();
    return deleted;
  }
}

export class MemoryMetaRepository implements IMetaRepository {
  constructor(private db: LifeHubDatabase = defaultDb) {}

  async getEntityTypes(): Promise<MetaEntityType[]> {
    return Array.from(this.db.entityTypes.values());
  }

  async getEntityTypeById(id: string): Promise<MetaEntityType | null> {
    return this.db.entityTypes.get(id) || null;
  }

  async getEntityTypeByCode(code: string): Promise<MetaEntityType | null> {
    for (const t of this.db.entityTypes.values()) {
      if (t.code === code) return t;
    }
    return null;
  }

  async createEntityType(entityType: MetaEntityType): Promise<MetaEntityType> {
    this.db.entityTypes.set(entityType.id, entityType);
    this.db.saveToDisk();
    return entityType;
  }

  async updateEntityType(id: string, updates: Partial<MetaEntityType>): Promise<MetaEntityType | null> {
    const type = this.db.entityTypes.get(id);
    if (!type) return null;
    Object.assign(type, updates);
    this.db.saveToDisk();
    return type;
  }

  async deleteEntityType(id: string): Promise<boolean> {
    const deleted = this.db.entityTypes.delete(id);
    if (deleted) this.db.saveToDisk();
    return deleted;
  }

  async getPropertyDefinitions(entityTypeId?: string): Promise<MetaPropertyDefinition[]> {
    const all = Array.from(this.db.propertyDefinitions.values());
    if (entityTypeId) return all.filter((p) => p.entity_type_id === entityTypeId);
    return all;
  }

  async getPropertyDefinitionById(id: string): Promise<MetaPropertyDefinition | null> {
    return this.db.propertyDefinitions.get(id) || null;
  }

  async createPropertyDefinition(prop: MetaPropertyDefinition): Promise<MetaPropertyDefinition> {
    this.db.propertyDefinitions.set(prop.id, prop);
    this.db.saveToDisk();
    return prop;
  }

  async updatePropertyDefinition(id: string, updates: Partial<MetaPropertyDefinition>): Promise<MetaPropertyDefinition | null> {
    const prop = this.db.propertyDefinitions.get(id);
    if (!prop) return null;
    Object.assign(prop, updates);
    this.db.saveToDisk();
    return prop;
  }

  async deletePropertyDefinition(id: string): Promise<boolean> {
    const deleted = this.db.propertyDefinitions.delete(id);
    if (deleted) this.db.saveToDisk();
    return deleted;
  }

  async getPropertyGroups(entityTypeId?: string): Promise<MetaPropertyGroup[]> {
    const all = Array.from(this.db.propertyGroups.values());
    if (entityTypeId) return all.filter((g) => g.entity_type_id === entityTypeId);
    return all;
  }

  async createPropertyGroup(group: MetaPropertyGroup): Promise<MetaPropertyGroup> {
    this.db.propertyGroups.set(group.id, group);
    this.db.saveToDisk();
    return group;
  }

  async deletePropertyGroup(id: string): Promise<boolean> {
    const deleted = this.db.propertyGroups.delete(id);
    if (deleted) this.db.saveToDisk();
    return deleted;
  }
}

export class MemorySharedRepository implements ISharedRepository {
  constructor(private db: LifeHubDatabase = defaultDb) {}

  async getTags(): Promise<SharedTag[]> {
    return Array.from(this.db.tags.values());
  }

  async getTagById(id: string): Promise<SharedTag | null> {
    return this.db.tags.get(id) || null;
  }

  async createTag(tag: SharedTag): Promise<SharedTag> {
    this.db.tags.set(tag.id, tag);
    this.db.saveToDisk();
    return tag;
  }

  async deleteTag(id: string): Promise<boolean> {
    const deleted = this.db.tags.delete(id);
    if (deleted) {
      this.db.entityTags = this.db.entityTags.filter((et) => et.tag_id !== id);
      this.db.saveToDisk();
    }
    return deleted;
  }

  async getEntityTags(entityId: string): Promise<SharedTag[]> {
    const tagIds = this.db.entityTags.filter((et) => et.entity_id === entityId).map((et) => et.tag_id);
    return tagIds.map((tid) => this.db.tags.get(tid)).filter(Boolean) as SharedTag[];
  }

  async setEntityTags(entityId: string, tagIds: string[]): Promise<void> {
    this.db.entityTags = this.db.entityTags.filter((et) => et.entity_id !== entityId);
    for (const tid of tagIds) {
      this.db.entityTags.push({ id: `et_${Date.now()}_${Math.random()}`, entity_id: entityId, tag_id: tid });
    }
    this.db.saveToDisk();
  }

  async getLinkTypes(): Promise<SharedLinkType[]> {
    return Array.from(this.db.linkTypes.values());
  }

  async createLinkType(linkType: SharedLinkType): Promise<SharedLinkType> {
    this.db.linkTypes.set(linkType.id, linkType);
    this.db.saveToDisk();
    return linkType;
  }

  async getLinks(entityId?: string): Promise<SharedLink[]> {
    if (entityId) {
      return this.db.links.filter((l) => l.source_entity_id === entityId || l.target_entity_id === entityId);
    }
    return this.db.links;
  }

  async createLink(link: SharedLink): Promise<SharedLink> {
    this.db.links.push(link);
    this.db.saveToDisk();
    return link;
  }

  async deleteLink(id: string): Promise<boolean> {
    const prevLen = this.db.links.length;
    this.db.links = this.db.links.filter((l) => l.id !== id);
    const changed = this.db.links.length < prevLen;
    if (changed) this.db.saveToDisk();
    return changed;
  }

  async getFiles(): Promise<SharedFile[]> {
    return Array.from(this.db.files.values());
  }

  async createFile(file: SharedFile): Promise<SharedFile> {
    this.db.files.set(file.id, file);
    this.db.saveToDisk();
    return file;
  }

  async getEntityFiles(entityId: string): Promise<SharedEntityFile[]> {
    return this.db.entityFiles.filter((ef) => ef.entity_id === entityId);
  }

  async linkFileToEntity(link: SharedEntityFile): Promise<void> {
    this.db.entityFiles.push(link);
    this.db.saveToDisk();
  }
}

export class MemoryPeopleRepository implements IPeopleRepository {
  constructor(private db: LifeHubDatabase = defaultDb) {}

  async getAll(): Promise<PeoplePerson[]> {
    return Array.from(this.db.people.values());
  }

  async getById(id: string): Promise<PeoplePerson | null> {
    return this.db.people.get(id) || null;
  }

  async create(person: PeoplePerson): Promise<PeoplePerson> {
    this.db.people.set(person.id, person);
    this.db.saveToDisk();
    return person;
  }

  async update(id: string, updates: Partial<PeoplePerson>): Promise<PeoplePerson | null> {
    const p = this.db.people.get(id);
    if (!p) return null;
    Object.assign(p, updates);
    this.db.saveToDisk();
    return p;
  }

  async delete(id: string): Promise<boolean> {
    const deleted = this.db.people.delete(id);
    if (deleted) this.db.saveToDisk();
    return deleted;
  }

  async getContacts(personId: string): Promise<PeopleContact[]> {
    return Array.from(this.db.contacts.values()).filter((c) => c.person_id === personId);
  }

  async addContact(contact: PeopleContact): Promise<PeopleContact> {
    this.db.contacts.set(contact.id, contact);
    this.db.saveToDisk();
    return contact;
  }

  async deleteContact(id: string): Promise<boolean> {
    const deleted = this.db.contacts.delete(id);
    if (deleted) this.db.saveToDisk();
    return deleted;
  }

  async getRelationships(personId: string): Promise<PeopleRelationship[]> {
    return this.db.relationships.filter((r) => r.person_a_id === personId || r.person_b_id === personId);
  }

  async addRelationship(rel: PeopleRelationship): Promise<PeopleRelationship> {
    this.db.relationships.push(rel);
    this.db.saveToDisk();
    return rel;
  }

  async deleteRelationship(id: string): Promise<boolean> {
    const prevLen = this.db.relationships.length;
    this.db.relationships = this.db.relationships.filter((r) => r.id !== id);
    const changed = this.db.relationships.length < prevLen;
    if (changed) this.db.saveToDisk();
    return changed;
  }
}

export class MemoryPlacesRepository implements IPlacesRepository {
  constructor(private db: LifeHubDatabase = defaultDb) {}

  async getAll(): Promise<PlacesPlace[]> {
    return Array.from(this.db.places.values());
  }

  async getById(id: string): Promise<PlacesPlace | null> {
    return this.db.places.get(id) || null;
  }

  async create(place: PlacesPlace): Promise<PlacesPlace> {
    this.db.places.set(place.id, place);
    this.db.saveToDisk();
    return place;
  }

  async update(id: string, updates: Partial<PlacesPlace>): Promise<PlacesPlace | null> {
    const pl = this.db.places.get(id);
    if (!pl) return null;
    Object.assign(pl, updates);
    this.db.saveToDisk();
    return pl;
  }

  async delete(id: string): Promise<boolean> {
    const deleted = this.db.places.delete(id);
    if (deleted) this.db.saveToDisk();
    return deleted;
  }

  async getVisits(placeId: string): Promise<PlacesVisit[]> {
    return this.db.visits.filter((v) => v.place_id === placeId);
  }

  async addVisit(visit: PlacesVisit): Promise<PlacesVisit> {
    this.db.visits.push(visit);
    this.db.saveToDisk();
    return visit;
  }

  async deleteVisit(id: string): Promise<boolean> {
    const prevLen = this.db.visits.length;
    this.db.visits = this.db.visits.filter((v) => v.id !== id);
    const changed = this.db.visits.length < prevLen;
    if (changed) this.db.saveToDisk();
    return changed;
  }
}

export class MemoryEventsRepository implements IEventsRepository {
  constructor(private db: LifeHubDatabase = defaultDb) {}

  async getAll(): Promise<EventsEvent[]> {
    return Array.from(this.db.events.values());
  }

  async getById(id: string): Promise<EventsEvent | null> {
    return this.db.events.get(id) || null;
  }

  async create(event: EventsEvent): Promise<EventsEvent> {
    this.db.events.set(event.id, event);
    this.db.saveToDisk();
    return event;
  }

  async update(id: string, updates: Partial<EventsEvent>): Promise<EventsEvent | null> {
    const ev = this.db.events.get(id);
    if (!ev) return null;
    Object.assign(ev, updates);
    this.db.saveToDisk();
    return ev;
  }

  async delete(id: string): Promise<boolean> {
    const deleted = this.db.events.delete(id);
    if (deleted) this.db.saveToDisk();
    return deleted;
  }

  async getParticipants(eventId: string): Promise<EventsParticipant[]> {
    return this.db.participants.filter((p) => p.event_id === eventId);
  }

  async addParticipant(participant: EventsParticipant): Promise<EventsParticipant> {
    this.db.participants.push(participant);
    this.db.saveToDisk();
    return participant;
  }

  async removeParticipant(id: string): Promise<boolean> {
    const prevLen = this.db.participants.length;
    this.db.participants = this.db.participants.filter((p) => p.id !== id);
    const changed = this.db.participants.length < prevLen;
    if (changed) this.db.saveToDisk();
    return changed;
  }
}

export class MemoryKnowledgeRepository implements IKnowledgeRepository {
  constructor(private db: LifeHubDatabase = defaultDb) {}

  async getAll(): Promise<KnowledgeItem[]> {
    return Array.from(this.db.knowledgeItems.values());
  }

  async getById(id: string): Promise<KnowledgeItem | null> {
    return this.db.knowledgeItems.get(id) || null;
  }

  async getByEntityType(entityTypeId: string): Promise<KnowledgeItem[]> {
    return Array.from(this.db.knowledgeItems.values()).filter((k) => k.entity_type_id === entityTypeId);
  }

  async create(item: KnowledgeItem): Promise<KnowledgeItem> {
    this.db.knowledgeItems.set(item.id, item);
    this.db.saveToDisk();
    return item;
  }

  async update(id: string, updates: Partial<KnowledgeItem>): Promise<KnowledgeItem | null> {
    const it = this.db.knowledgeItems.get(id);
    if (!it) return null;
    Object.assign(it, updates);
    this.db.saveToDisk();
    return it;
  }

  async delete(id: string): Promise<boolean> {
    const deleted = this.db.knowledgeItems.delete(id);
    if (deleted) this.db.saveToDisk();
    return deleted;
  }
}

export class MemoryBuildingsRepository implements IBuildingsRepository {
  constructor(private db: LifeHubDatabase = defaultDb) {}

  async getAll(): Promise<BuildingsBuilding[]> {
    return Array.from(this.db.buildings.values());
  }

  async getById(id: string): Promise<BuildingsBuilding | null> {
    return this.db.buildings.get(id) || null;
  }

  async create(building: BuildingsBuilding): Promise<BuildingsBuilding> {
    this.db.buildings.set(building.id, building);
    this.db.saveToDisk();
    return building;
  }

  async update(id: string, updates: Partial<BuildingsBuilding>): Promise<BuildingsBuilding | null> {
    const b = this.db.buildings.get(id);
    if (!b) return null;
    Object.assign(b, updates);
    this.db.saveToDisk();
    return b;
  }

  async delete(id: string): Promise<boolean> {
    const deleted = this.db.buildings.delete(id);
    if (deleted) this.db.saveToDisk();
    return deleted;
  }
}

export class MemoryAuditRepository implements IAuditRepository {
  constructor(private db: LifeHubDatabase = defaultDb) {}

  async log(entry: Omit<CoreAuditLog, 'id' | 'timestamp'>): Promise<CoreAuditLog> {
    const log: CoreAuditLog = {
      ...entry,
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
    };
    this.db.auditLog.unshift(log);
    if (this.db.auditLog.length > 500) this.db.auditLog.pop();
    this.db.saveToDisk();
    return log;
  }

  async getAll(limit = 100): Promise<CoreAuditLog[]> {
    return this.db.auditLog.slice(0, limit);
  }

  async getByEntity(entityId: string): Promise<CoreAuditLog[]> {
    return this.db.auditLog.filter((a) => a.entity_id === entityId);
  }

  async getByUser(userId: string): Promise<CoreAuditLog[]> {
    return this.db.auditLog.filter((a) => a.user_id === userId);
  }
}

export class MemorySettingsRepository implements ISettingsRepository {
  constructor(private db: LifeHubDatabase = defaultDb) {}

  async get(key: string): Promise<any> {
    const setting = this.db.settings.get(key);
    if (setting !== undefined) return setting.value;
    if (this.db.instanceConfig && this.db.instanceConfig.settings && key in this.db.instanceConfig.settings) {
      return (this.db.instanceConfig.settings as any)[key];
    }
    return undefined;
  }

  async set(key: string, value: any, description = ''): Promise<CoreSetting> {
    const setting: CoreSetting = {
      key,
      value,
      description,
      updated_at: new Date().toISOString(),
    };
    this.db.settings.set(key, setting);
    this.db.saveToDisk();
    return setting;
  }

  async getAll(): Promise<CoreSetting[]> {
    return Array.from(this.db.settings.values());
  }
}

export class MemoryExtensionsRepository implements IExtensionsRepository {
  constructor(private db: LifeHubDatabase = defaultDb) {}

  async getAll(): Promise<TechnicalExtension[]> {
    return Array.from(this.db.extensions.values());
  }

  async getByCode(code: string): Promise<TechnicalExtension | null> {
    return this.db.extensions.get(code) || null;
  }

  async toggle(code: string, enabled: boolean): Promise<TechnicalExtension | null> {
    const ext = this.db.extensions.get(code);
    if (!ext) return null;
    ext.is_enabled = enabled;
    ext.status = enabled ? 'active' : 'disabled';
    this.db.saveToDisk();
    return ext;
  }
}
