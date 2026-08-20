import {
  CoreUser,
  CoreRole,
  CoreRolePermission,
  CoreSession,
  CoreSetting,
  CoreEntity,
  CoreModule,
  CoreAuditLog,
  MetaEntityType,
  MetaPropertyDefinition,
  MetaPropertyGroup,
  SharedTag,
  SharedEntityTag,
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
} from '../db/types.js';

export interface IUserRepository {
  getById(id: string): Promise<CoreUser | null>;
  getByUsername(username: string): Promise<CoreUser | null>;
  getByEmail(email: string): Promise<CoreUser | null>;
  getAll(): Promise<CoreUser[]>;
  create(user: CoreUser): Promise<CoreUser>;
  update(id: string, updates: Partial<CoreUser>): Promise<CoreUser | null>;
  delete(id: string): Promise<boolean>;
}

export interface IRoleRepository {
  getAllRoles(): Promise<CoreRole[]>;
  getRoleById(id: string): Promise<CoreRole | null>;
  getPermissionsForRole(roleId: string): Promise<CoreRolePermission[]>;
  setPermission(roleId: string, permissionKey: string, allowed: boolean): Promise<CoreRolePermission>;
}

export interface IEntityRepository {
  getById(id: string): Promise<CoreEntity | null>;
  getByType(type: string): Promise<CoreEntity[]>;
  getAll(): Promise<CoreEntity[]>;
  create(entity: CoreEntity): Promise<CoreEntity>;
  update(id: string, updates: Partial<CoreEntity>): Promise<CoreEntity | null>;
  delete(id: string): Promise<boolean>;
}

export interface IMetaRepository {
  getEntityTypes(): Promise<MetaEntityType[]>;
  getEntityTypeById(id: string): Promise<MetaEntityType | null>;
  getEntityTypeByCode(code: string): Promise<MetaEntityType | null>;
  createEntityType(entityType: MetaEntityType): Promise<MetaEntityType>;
  updateEntityType(id: string, updates: Partial<MetaEntityType>): Promise<MetaEntityType | null>;
  deleteEntityType(id: string): Promise<boolean>;

  getPropertyDefinitions(entityTypeId?: string): Promise<MetaPropertyDefinition[]>;
  getPropertyDefinitionById(id: string): Promise<MetaPropertyDefinition | null>;
  createPropertyDefinition(prop: MetaPropertyDefinition): Promise<MetaPropertyDefinition>;
  updatePropertyDefinition(id: string, updates: Partial<MetaPropertyDefinition>): Promise<MetaPropertyDefinition | null>;
  deletePropertyDefinition(id: string): Promise<boolean>;

  getPropertyGroups(entityTypeId?: string): Promise<MetaPropertyGroup[]>;
  createPropertyGroup(group: MetaPropertyGroup): Promise<MetaPropertyGroup>;
  deletePropertyGroup(id: string): Promise<boolean>;
}

export interface ISharedRepository {
  getTags(): Promise<SharedTag[]>;
  getTagById(id: string): Promise<SharedTag | null>;
  createTag(tag: SharedTag): Promise<SharedTag>;
  deleteTag(id: string): Promise<boolean>;

  getEntityTags(entityId: string): Promise<SharedTag[]>;
  setEntityTags(entityId: string, tagIds: string[]): Promise<void>;

  getLinkTypes(): Promise<SharedLinkType[]>;
  createLinkType(linkType: SharedLinkType): Promise<SharedLinkType>;

  getLinks(entityId?: string): Promise<SharedLink[]>;
  createLink(link: SharedLink): Promise<SharedLink>;
  deleteLink(id: string): Promise<boolean>;

  getFiles(): Promise<SharedFile[]>;
  createFile(file: SharedFile): Promise<SharedFile>;
  getEntityFiles(entityId: string): Promise<SharedEntityFile[]>;
  linkFileToEntity(link: SharedEntityFile): Promise<void>;
}

export interface IPeopleRepository {
  getAll(): Promise<PeoplePerson[]>;
  getById(id: string): Promise<PeoplePerson | null>;
  create(person: PeoplePerson): Promise<PeoplePerson>;
  update(id: string, updates: Partial<PeoplePerson>): Promise<PeoplePerson | null>;
  delete(id: string): Promise<boolean>;

  getContacts(personId: string): Promise<PeopleContact[]>;
  addContact(contact: PeopleContact): Promise<PeopleContact>;
  deleteContact(id: string): Promise<boolean>;

  getRelationships(personId: string): Promise<PeopleRelationship[]>;
  addRelationship(rel: PeopleRelationship): Promise<PeopleRelationship>;
  deleteRelationship(id: string): Promise<boolean>;
}

export interface IPlacesRepository {
  getAll(): Promise<PlacesPlace[]>;
  getById(id: string): Promise<PlacesPlace | null>;
  create(place: PlacesPlace): Promise<PlacesPlace>;
  update(id: string, updates: Partial<PlacesPlace>): Promise<PlacesPlace | null>;
  delete(id: string): Promise<boolean>;

  getVisits(placeId: string): Promise<PlacesVisit[]>;
  addVisit(visit: PlacesVisit): Promise<PlacesVisit>;
  deleteVisit(id: string): Promise<boolean>;
}

export interface IEventsRepository {
  getAll(): Promise<EventsEvent[]>;
  getById(id: string): Promise<EventsEvent | null>;
  create(event: EventsEvent): Promise<EventsEvent>;
  update(id: string, updates: Partial<EventsEvent>): Promise<EventsEvent | null>;
  delete(id: string): Promise<boolean>;

  getParticipants(eventId: string): Promise<EventsParticipant[]>;
  addParticipant(participant: EventsParticipant): Promise<EventsParticipant>;
  removeParticipant(id: string): Promise<boolean>;
}

export interface IKnowledgeRepository {
  getAll(): Promise<KnowledgeItem[]>;
  getById(id: string): Promise<KnowledgeItem | null>;
  getByEntityType(entityTypeId: string): Promise<KnowledgeItem[]>;
  create(item: KnowledgeItem): Promise<KnowledgeItem>;
  update(id: string, updates: Partial<KnowledgeItem>): Promise<KnowledgeItem | null>;
  delete(id: string): Promise<boolean>;
}

export interface IBuildingsRepository {
  getAll(): Promise<BuildingsBuilding[]>;
  getById(id: string): Promise<BuildingsBuilding | null>;
  create(building: BuildingsBuilding): Promise<BuildingsBuilding>;
  update(id: string, updates: Partial<BuildingsBuilding>): Promise<BuildingsBuilding | null>;
  delete(id: string): Promise<boolean>;
}

export interface IAuditRepository {
  log(entry: Omit<CoreAuditLog, 'id' | 'timestamp'>): Promise<CoreAuditLog>;
  getAll(limit?: number): Promise<CoreAuditLog[]>;
  getByEntity(entityId: string): Promise<CoreAuditLog[]>;
  getByUser(userId: string): Promise<CoreAuditLog[]>;
}

export interface ISettingsRepository {
  get(key: string): Promise<any>;
  set(key: string, value: any, description?: string): Promise<CoreSetting>;
  getAll(): Promise<CoreSetting[]>;
}

export interface IExtensionsRepository {
  getAll(): Promise<TechnicalExtension[]>;
  getByCode(code: string): Promise<TechnicalExtension | null>;
  toggle(code: string, enabled: boolean): Promise<TechnicalExtension | null>;
}
