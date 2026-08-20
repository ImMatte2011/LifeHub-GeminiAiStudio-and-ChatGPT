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
} from './interfaces.js';
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
} from './memory/MemoryRepository.js';
import {
  PostgresUserRepository,
  PostgresEntityRepository,
  PostgresAuditRepository,
} from './postgres/PostgresRepository.js';
import { db as inMemoryDb } from '../db/database.js';

export type PersistenceDriver = 'memory' | 'postgres';

export class RepositoryManager {
  private driver: PersistenceDriver;

  public users: IUserRepository;
  public roles: IRoleRepository;
  public entities: IEntityRepository;
  public meta: IMetaRepository;
  public shared: ISharedRepository;
  public people: IPeopleRepository;
  public places: IPlacesRepository;
  public events: IEventsRepository;
  public knowledge: IKnowledgeRepository;
  public buildings: IBuildingsRepository;
  public audit: IAuditRepository;
  public settings: ISettingsRepository;
  public extensions: IExtensionsRepository;

  constructor(driver: PersistenceDriver = 'memory') {
    this.driver = driver;

    // Initialize default memory adapters referencing the single database instance
    this.users = driver === 'postgres' ? new PostgresUserRepository() : new MemoryUserRepository(inMemoryDb);
    this.roles = new MemoryRoleRepository(inMemoryDb);
    this.entities = driver === 'postgres' ? new PostgresEntityRepository() : new MemoryEntityRepository(inMemoryDb);
    this.meta = new MemoryMetaRepository(inMemoryDb);
    this.shared = new MemorySharedRepository(inMemoryDb);
    this.people = new MemoryPeopleRepository(inMemoryDb);
    this.places = new MemoryPlacesRepository(inMemoryDb);
    this.events = new MemoryEventsRepository(inMemoryDb);
    this.knowledge = new MemoryKnowledgeRepository(inMemoryDb);
    this.buildings = new MemoryBuildingsRepository(inMemoryDb);
    this.audit = driver === 'postgres' ? new PostgresAuditRepository() : new MemoryAuditRepository(inMemoryDb);
    this.settings = new MemorySettingsRepository(inMemoryDb);
    this.extensions = new MemoryExtensionsRepository(inMemoryDb);
  }

  public getActiveDriver(): PersistenceDriver {
    return this.driver;
  }
}

// Singleton repository manager
export const repositories = new RepositoryManager(
  (process.env.PERSISTENCE_DRIVER as PersistenceDriver) || 'memory'
);

export * from './interfaces.js';
