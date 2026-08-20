import { eq, desc } from 'drizzle-orm';
import { db as drizzleDb } from '../../../src/db/index.js';
import * as schema from '../../../src/db/schema.js';
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

export class PostgresUserRepository implements IUserRepository {
  async getById(id: string): Promise<CoreUser | null> {
    const rows = await drizzleDb.select().from(schema.users).where(eq(schema.users.id, id));
    if (!rows.length) return null;
    const r = rows[0];
    return {
      id: r.id,
      username: r.username,
      email: r.email,
      password_hash: r.passwordHash,
      full_name: r.fullName,
      avatar_url: r.avatarUrl || undefined,
      role_id: r.roleId,
      is_active: r.isActive,
      created_at: r.createdAt ? r.createdAt.toISOString() : new Date().toISOString(),
      last_login: r.lastLogin ? r.lastLogin.toISOString() : undefined,
    };
  }

  async getByUsername(username: string): Promise<CoreUser | null> {
    const rows = await drizzleDb.select().from(schema.users).where(eq(schema.users.username, username));
    if (!rows.length) return null;
    const r = rows[0];
    return {
      id: r.id,
      username: r.username,
      email: r.email,
      password_hash: r.passwordHash,
      full_name: r.fullName,
      avatar_url: r.avatarUrl || undefined,
      role_id: r.roleId,
      is_active: r.isActive,
      created_at: r.createdAt ? r.createdAt.toISOString() : new Date().toISOString(),
      last_login: r.lastLogin ? r.lastLogin.toISOString() : undefined,
    };
  }

  async getByEmail(email: string): Promise<CoreUser | null> {
    const rows = await drizzleDb.select().from(schema.users).where(eq(schema.users.email, email));
    if (!rows.length) return null;
    const r = rows[0];
    return {
      id: r.id,
      username: r.username,
      email: r.email,
      password_hash: r.passwordHash,
      full_name: r.fullName,
      avatar_url: r.avatarUrl || undefined,
      role_id: r.roleId,
      is_active: r.isActive,
      created_at: r.createdAt ? r.createdAt.toISOString() : new Date().toISOString(),
      last_login: r.lastLogin ? r.lastLogin.toISOString() : undefined,
    };
  }

  async getAll(): Promise<CoreUser[]> {
    const rows = await drizzleDb.select().from(schema.users);
    return rows.map((r) => ({
      id: r.id,
      username: r.username,
      email: r.email,
      password_hash: r.passwordHash,
      full_name: r.fullName,
      avatar_url: r.avatarUrl || undefined,
      role_id: r.roleId,
      is_active: r.isActive,
      created_at: r.createdAt ? r.createdAt.toISOString() : new Date().toISOString(),
      last_login: r.lastLogin ? r.lastLogin.toISOString() : undefined,
    }));
  }

  async create(user: CoreUser): Promise<CoreUser> {
    await drizzleDb.insert(schema.users).values({
      id: user.id,
      username: user.username,
      email: user.email,
      passwordHash: user.password_hash,
      fullName: user.full_name,
      avatarUrl: user.avatar_url,
      roleId: user.role_id,
      isActive: user.is_active,
      createdAt: user.created_at ? new Date(user.created_at) : new Date(),
      lastLogin: user.last_login ? new Date(user.last_login) : null,
    });
    return user;
  }

  async update(id: string, updates: Partial<CoreUser>): Promise<CoreUser | null> {
    const toUpdate: any = {};
    if (updates.username !== undefined) toUpdate.username = updates.username;
    if (updates.email !== undefined) toUpdate.email = updates.email;
    if (updates.password_hash !== undefined) toUpdate.passwordHash = updates.password_hash;
    if (updates.full_name !== undefined) toUpdate.fullName = updates.full_name;
    if (updates.avatar_url !== undefined) toUpdate.avatarUrl = updates.avatar_url;
    if (updates.role_id !== undefined) toUpdate.roleId = updates.role_id;
    if (updates.is_active !== undefined) toUpdate.isActive = updates.is_active;
    if (updates.last_login !== undefined) toUpdate.lastLogin = updates.last_login ? new Date(updates.last_login) : null;

    await drizzleDb.update(schema.users).set(toUpdate).where(eq(schema.users.id, id));
    return this.getById(id);
  }

  async delete(id: string): Promise<boolean> {
    const res = await drizzleDb.delete(schema.users).where(eq(schema.users.id, id)).returning();
    return res.length > 0;
  }
}

export class PostgresEntityRepository implements IEntityRepository {
  async getById(id: string): Promise<CoreEntity | null> {
    const rows = await drizzleDb.select().from(schema.entities).where(eq(schema.entities.id, id));
    if (!rows.length) return null;
    const r = rows[0];
    return {
      id: r.id,
      entity_type: r.entityType,
      title: r.title,
      created_at: r.createdAt ? r.createdAt.toISOString() : new Date().toISOString(),
      updated_at: r.updatedAt ? r.updatedAt.toISOString() : new Date().toISOString(),
      created_by: r.createdBy || undefined,
    };
  }

  async getByType(type: string): Promise<CoreEntity[]> {
    const rows = await drizzleDb.select().from(schema.entities).where(eq(schema.entities.entityType, type));
    return rows.map((r) => ({
      id: r.id,
      entity_type: r.entityType,
      title: r.title,
      created_at: r.createdAt ? r.createdAt.toISOString() : new Date().toISOString(),
      updated_at: r.updatedAt ? r.updatedAt.toISOString() : new Date().toISOString(),
      created_by: r.createdBy || undefined,
    }));
  }

  async getAll(): Promise<CoreEntity[]> {
    const rows = await drizzleDb.select().from(schema.entities);
    return rows.map((r) => ({
      id: r.id,
      entity_type: r.entityType,
      title: r.title,
      created_at: r.createdAt ? r.createdAt.toISOString() : new Date().toISOString(),
      updated_at: r.updatedAt ? r.updatedAt.toISOString() : new Date().toISOString(),
      created_by: r.createdBy || undefined,
    }));
  }

  async create(entity: CoreEntity): Promise<CoreEntity> {
    await drizzleDb.insert(schema.entities).values({
      id: entity.id,
      entityType: entity.entity_type,
      title: entity.title,
      createdAt: entity.created_at ? new Date(entity.created_at) : new Date(),
      updatedAt: entity.updated_at ? new Date(entity.updated_at) : new Date(),
      createdBy: entity.created_by,
    });
    return entity;
  }

  async update(id: string, updates: Partial<CoreEntity>): Promise<CoreEntity | null> {
    const toUpdate: any = { updatedAt: new Date() };
    if (updates.title !== undefined) toUpdate.title = updates.title;
    if (updates.entity_type !== undefined) toUpdate.entityType = updates.entity_type;
    await drizzleDb.update(schema.entities).set(toUpdate).where(eq(schema.entities.id, id));
    return this.getById(id);
  }

  async delete(id: string): Promise<boolean> {
    const res = await drizzleDb.delete(schema.entities).where(eq(schema.entities.id, id)).returning();
    return res.length > 0;
  }
}

export class PostgresAuditRepository implements IAuditRepository {
  async log(entry: Omit<CoreAuditLog, 'id' | 'timestamp'>): Promise<CoreAuditLog> {
    const id = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date();
    await drizzleDb.insert(schema.auditLogs).values({
      id,
      userId: entry.user_id,
      username: entry.username,
      action: entry.action,
      entityId: entry.entity_id,
      entityType: entry.entity_type,
      details: entry.details,
      metadata: entry.metadata,
      timestamp: now,
    });
    return {
      ...entry,
      id,
      timestamp: now.toISOString(),
    };
  }

  async getAll(limit = 100): Promise<CoreAuditLog[]> {
    const rows = await drizzleDb
      .select()
      .from(schema.auditLogs)
      .orderBy(desc(schema.auditLogs.timestamp))
      .limit(limit);

    return rows.map((r) => ({
      id: r.id,
      user_id: r.userId,
      username: r.username,
      action: r.action as any,
      entity_id: r.entityId || undefined,
      entity_type: r.entityType || undefined,
      details: r.details,
      metadata: (r.metadata as Record<string, any>) || undefined,
      timestamp: r.timestamp ? r.timestamp.toISOString() : new Date().toISOString(),
    }));
  }

  async getByEntity(entityId: string): Promise<CoreAuditLog[]> {
    const rows = await drizzleDb
      .select()
      .from(schema.auditLogs)
      .where(eq(schema.auditLogs.entityId, entityId))
      .orderBy(desc(schema.auditLogs.timestamp));

    return rows.map((r) => ({
      id: r.id,
      user_id: r.userId,
      username: r.username,
      action: r.action as any,
      entity_id: r.entityId || undefined,
      entity_type: r.entityType || undefined,
      details: r.details,
      metadata: (r.metadata as Record<string, any>) || undefined,
      timestamp: r.timestamp ? r.timestamp.toISOString() : new Date().toISOString(),
    }));
  }

  async getByUser(userId: string): Promise<CoreAuditLog[]> {
    const rows = await drizzleDb
      .select()
      .from(schema.auditLogs)
      .where(eq(schema.auditLogs.userId, userId))
      .orderBy(desc(schema.auditLogs.timestamp));

    return rows.map((r) => ({
      id: r.id,
      user_id: r.userId,
      username: r.username,
      action: r.action as any,
      entity_id: r.entityId || undefined,
      entity_type: r.entityType || undefined,
      details: r.details,
      metadata: (r.metadata as Record<string, any>) || undefined,
      timestamp: r.timestamp ? r.timestamp.toISOString() : new Date().toISOString(),
    }));
  }
}
