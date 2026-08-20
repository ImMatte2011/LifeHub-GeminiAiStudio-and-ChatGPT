import { eq, desc, or, inArray, asc } from 'drizzle-orm';
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

// ==============================================================================
// 1. Core Repositories
// ==============================================================================

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

export class PostgresRoleRepository implements IRoleRepository {
  async getAllRoles(): Promise<CoreRole[]> {
    const rows = await drizzleDb.select().from(schema.roles);
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      is_admin: r.isAdmin,
    }));
  }

  async getRoleById(id: string): Promise<CoreRole | null> {
    const rows = await drizzleDb.select().from(schema.roles).where(eq(schema.roles.id, id));
    if (!rows.length) return null;
    const r = rows[0];
    return {
      id: r.id,
      name: r.name,
      description: r.description,
      is_admin: r.isAdmin,
    };
  }

  async getPermissionsForRole(roleId: string): Promise<CoreRolePermission[]> {
    const rows = await drizzleDb
      .select()
      .from(schema.rolePermissions)
      .where(eq(schema.rolePermissions.roleId, roleId));

    return rows.map((r) => ({
      id: r.id,
      role_id: r.roleId,
      permission_key: r.permissionKey,
      allowed: r.allowed,
    }));
  }

  async setPermission(roleId: string, permissionKey: string, allowed: boolean): Promise<CoreRolePermission> {
    const id = `perm_${roleId}_${permissionKey}`;
    await drizzleDb
      .insert(schema.rolePermissions)
      .values({
        id,
        roleId,
        permissionKey,
        allowed,
      })
      .onConflictDoUpdate({
        target: schema.rolePermissions.id,
        set: { allowed },
      });

    return {
      id,
      role_id: roleId,
      permission_key: permissionKey,
      allowed,
    };
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

export class PostgresSettingsRepository implements ISettingsRepository {
  async get(key: string): Promise<any> {
    const rows = await drizzleDb.select().from(schema.settings).where(eq(schema.settings.key, key));
    if (!rows.length) return undefined;
    return rows[0].value;
  }

  async set(key: string, value: any, description = ''): Promise<CoreSetting> {
    const now = new Date();
    await drizzleDb
      .insert(schema.settings)
      .values({
        key,
        value,
        description,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: schema.settings.key,
        set: {
          value,
          description: description !== undefined ? description : schema.settings.description,
          updatedAt: now,
        },
      });

    return {
      key,
      value,
      description,
      updated_at: now.toISOString(),
    };
  }

  async getAll(): Promise<CoreSetting[]> {
    const rows = await drizzleDb.select().from(schema.settings);
    return rows.map((r) => ({
      key: r.key,
      value: r.value,
      description: r.description || '',
      updated_at: r.updatedAt ? r.updatedAt.toISOString() : new Date().toISOString(),
    }));
  }
}

// ==============================================================================
// 2. Meta Layer Repository
// ==============================================================================

export class PostgresMetaRepository implements IMetaRepository {
  async getEntityTypes(): Promise<MetaEntityType[]> {
    const rows = await drizzleDb.select().from(schema.metaEntityTypes);
    return rows.map((r) => ({
      id: r.id,
      code: r.code,
      name: r.name,
      icon: r.icon,
      description: r.description || '',
      schema_version: r.schemaVersion,
    }));
  }

  async getEntityTypeById(id: string): Promise<MetaEntityType | null> {
    const rows = await drizzleDb.select().from(schema.metaEntityTypes).where(eq(schema.metaEntityTypes.id, id));
    if (!rows.length) return null;
    const r = rows[0];
    return {
      id: r.id,
      code: r.code,
      name: r.name,
      icon: r.icon,
      description: r.description || '',
      schema_version: r.schemaVersion,
    };
  }

  async getEntityTypeByCode(code: string): Promise<MetaEntityType | null> {
    const rows = await drizzleDb.select().from(schema.metaEntityTypes).where(eq(schema.metaEntityTypes.code, code));
    if (!rows.length) return null;
    const r = rows[0];
    return {
      id: r.id,
      code: r.code,
      name: r.name,
      icon: r.icon,
      description: r.description || '',
      schema_version: r.schemaVersion,
    };
  }

  async createEntityType(entityType: MetaEntityType): Promise<MetaEntityType> {
    await drizzleDb.insert(schema.metaEntityTypes).values({
      id: entityType.id,
      code: entityType.code,
      name: entityType.name,
      icon: entityType.icon,
      description: entityType.description,
      schemaVersion: entityType.schema_version,
    });
    return entityType;
  }

  async updateEntityType(id: string, updates: Partial<MetaEntityType>): Promise<MetaEntityType | null> {
    const toUpdate: any = {};
    if (updates.name !== undefined) toUpdate.name = updates.name;
    if (updates.icon !== undefined) toUpdate.icon = updates.icon;
    if (updates.description !== undefined) toUpdate.description = updates.description;
    if (updates.schema_version !== undefined) toUpdate.schemaVersion = updates.schema_version;

    await drizzleDb.update(schema.metaEntityTypes).set(toUpdate).where(eq(schema.metaEntityTypes.id, id));
    return this.getEntityTypeById(id);
  }

  async deleteEntityType(id: string): Promise<boolean> {
    const res = await drizzleDb.delete(schema.metaEntityTypes).where(eq(schema.metaEntityTypes.id, id)).returning();
    return res.length > 0;
  }

  async getPropertyDefinitions(entityTypeId?: string): Promise<MetaPropertyDefinition[]> {
    const query = entityTypeId
      ? drizzleDb
          .select()
          .from(schema.metaPropertyDefinitions)
          .where(eq(schema.metaPropertyDefinitions.entityTypeId, entityTypeId))
          .orderBy(asc(schema.metaPropertyDefinitions.sortOrder))
      : drizzleDb
          .select()
          .from(schema.metaPropertyDefinitions)
          .orderBy(asc(schema.metaPropertyDefinitions.sortOrder));

    const rows = await query;
    return rows.map((r) => ({
      id: r.id,
      entity_type_id: r.entityTypeId,
      code: r.code,
      label: r.label,
      data_type: r.dataType as any,
      is_required: r.isRequired,
      sort_order: r.sortOrder,
      enum_values: (r.enumValues as string[]) || undefined,
      group_id: r.groupId || undefined,
      default_value: r.defaultValue ?? undefined,
    }));
  }

  async getPropertyDefinitionById(id: string): Promise<MetaPropertyDefinition | null> {
    const rows = await drizzleDb
      .select()
      .from(schema.metaPropertyDefinitions)
      .where(eq(schema.metaPropertyDefinitions.id, id));

    if (!rows.length) return null;
    const r = rows[0];
    return {
      id: r.id,
      entity_type_id: r.entityTypeId,
      code: r.code,
      label: r.label,
      data_type: r.dataType as any,
      is_required: r.isRequired,
      sort_order: r.sortOrder,
      enum_values: (r.enumValues as string[]) || undefined,
      group_id: r.groupId || undefined,
      default_value: r.defaultValue ?? undefined,
    };
  }

  async createPropertyDefinition(prop: MetaPropertyDefinition): Promise<MetaPropertyDefinition> {
    await drizzleDb.insert(schema.metaPropertyDefinitions).values({
      id: prop.id,
      entityTypeId: prop.entity_type_id,
      code: prop.code,
      label: prop.label,
      dataType: prop.data_type,
      isRequired: prop.is_required,
      sortOrder: prop.sort_order,
      enumValues: prop.enum_values,
      groupId: prop.group_id,
      defaultValue: prop.default_value,
    });
    return prop;
  }

  async updatePropertyDefinition(
    id: string,
    updates: Partial<MetaPropertyDefinition>
  ): Promise<MetaPropertyDefinition | null> {
    const toUpdate: any = {};
    if (updates.label !== undefined) toUpdate.label = updates.label;
    if (updates.data_type !== undefined) toUpdate.dataType = updates.data_type;
    if (updates.is_required !== undefined) toUpdate.isRequired = updates.is_required;
    if (updates.sort_order !== undefined) toUpdate.sortOrder = updates.sort_order;
    if (updates.enum_values !== undefined) toUpdate.enumValues = updates.enum_values;
    if (updates.group_id !== undefined) toUpdate.groupId = updates.group_id;
    if (updates.default_value !== undefined) toUpdate.defaultValue = updates.default_value;

    await drizzleDb.update(schema.metaPropertyDefinitions).set(toUpdate).where(eq(schema.metaPropertyDefinitions.id, id));
    return this.getPropertyDefinitionById(id);
  }

  async deletePropertyDefinition(id: string): Promise<boolean> {
    const res = await drizzleDb
      .delete(schema.metaPropertyDefinitions)
      .where(eq(schema.metaPropertyDefinitions.id, id))
      .returning();
    return res.length > 0;
  }

  async getPropertyGroups(entityTypeId?: string): Promise<MetaPropertyGroup[]> {
    const query = entityTypeId
      ? drizzleDb
          .select()
          .from(schema.metaPropertyGroups)
          .where(eq(schema.metaPropertyGroups.entityTypeId, entityTypeId))
          .orderBy(asc(schema.metaPropertyGroups.sortOrder))
      : drizzleDb
          .select()
          .from(schema.metaPropertyGroups)
          .orderBy(asc(schema.metaPropertyGroups.sortOrder));

    const rows = await query;
    return rows.map((r) => ({
      id: r.id,
      entity_type_id: r.entityTypeId,
      name: r.name,
      sort_order: r.sortOrder,
    }));
  }

  async createPropertyGroup(group: MetaPropertyGroup): Promise<MetaPropertyGroup> {
    await drizzleDb.insert(schema.metaPropertyGroups).values({
      id: group.id,
      entityTypeId: group.entity_type_id,
      name: group.name,
      sortOrder: group.sort_order,
    });
    return group;
  }

  async deletePropertyGroup(id: string): Promise<boolean> {
    const res = await drizzleDb
      .delete(schema.metaPropertyGroups)
      .where(eq(schema.metaPropertyGroups.id, id))
      .returning();
    return res.length > 0;
  }
}

// ==============================================================================
// 3. Shared Layer Repository
// ==============================================================================

export class PostgresSharedRepository implements ISharedRepository {
  async getTags(): Promise<SharedTag[]> {
    const rows = await drizzleDb.select().from(schema.sharedTags);
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      color: r.color,
      icon: r.icon || undefined,
    }));
  }

  async getTagById(id: string): Promise<SharedTag | null> {
    const rows = await drizzleDb.select().from(schema.sharedTags).where(eq(schema.sharedTags.id, id));
    if (!rows.length) return null;
    const r = rows[0];
    return {
      id: r.id,
      name: r.name,
      color: r.color,
      icon: r.icon || undefined,
    };
  }

  async createTag(tag: SharedTag): Promise<SharedTag> {
    await drizzleDb.insert(schema.sharedTags).values({
      id: tag.id,
      name: tag.name,
      color: tag.color,
      icon: tag.icon,
    });
    return tag;
  }

  async deleteTag(id: string): Promise<boolean> {
    await drizzleDb.delete(schema.sharedEntityTags).where(eq(schema.sharedEntityTags.tagId, id));
    const res = await drizzleDb.delete(schema.sharedTags).where(eq(schema.sharedTags.id, id)).returning();
    return res.length > 0;
  }

  async getEntityTags(entityId: string): Promise<SharedTag[]> {
    const entityTagRows = await drizzleDb
      .select()
      .from(schema.sharedEntityTags)
      .where(eq(schema.sharedEntityTags.entityId, entityId));

    if (!entityTagRows.length) return [];

    const tagIds = entityTagRows.map((r) => r.tagId);
    const tagRows = await drizzleDb.select().from(schema.sharedTags).where(inArray(schema.sharedTags.id, tagIds));

    return tagRows.map((r) => ({
      id: r.id,
      name: r.name,
      color: r.color,
      icon: r.icon || undefined,
    }));
  }

  async setEntityTags(entityId: string, tagIds: string[]): Promise<void> {
    await drizzleDb.delete(schema.sharedEntityTags).where(eq(schema.sharedEntityTags.entityId, entityId));

    for (const tagId of tagIds) {
      const id = `et_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      await drizzleDb.insert(schema.sharedEntityTags).values({
        id,
        entityId,
        tagId,
      });
    }
  }

  async getLinkTypes(): Promise<SharedLinkType[]> {
    const rows = await drizzleDb.select().from(schema.sharedLinkTypes);
    return rows.map((r) => ({
      id: r.id,
      code: r.code,
      forward_label: r.forwardLabel,
      reverse_label: r.reverseLabel,
    }));
  }

  async createLinkType(linkType: SharedLinkType): Promise<SharedLinkType> {
    await drizzleDb.insert(schema.sharedLinkTypes).values({
      id: linkType.id,
      code: linkType.code,
      forwardLabel: linkType.forward_label,
      reverseLabel: linkType.reverse_label,
    });
    return linkType;
  }

  async getLinks(entityId?: string): Promise<SharedLink[]> {
    const query = entityId
      ? drizzleDb
          .select()
          .from(schema.sharedLinks)
          .where(
            or(
              eq(schema.sharedLinks.sourceEntityId, entityId),
              eq(schema.sharedLinks.targetEntityId, entityId)
            )
          )
      : drizzleDb.select().from(schema.sharedLinks);

    const rows = await query;
    return rows.map((r) => ({
      id: r.id,
      source_entity_id: r.sourceEntityId,
      target_entity_id: r.targetEntityId,
      link_type_id: r.linkTypeId,
      notes: r.notes || undefined,
      created_at: r.createdAt ? r.createdAt.toISOString() : new Date().toISOString(),
    }));
  }

  async createLink(link: SharedLink): Promise<SharedLink> {
    await drizzleDb.insert(schema.sharedLinks).values({
      id: link.id,
      sourceEntityId: link.source_entity_id,
      targetEntityId: link.target_entity_id,
      linkTypeId: link.link_type_id,
      notes: link.notes,
      createdAt: link.created_at ? new Date(link.created_at) : new Date(),
    });
    return link;
  }

  async deleteLink(id: string): Promise<boolean> {
    const res = await drizzleDb.delete(schema.sharedLinks).where(eq(schema.sharedLinks.id, id)).returning();
    return res.length > 0;
  }

  async getFiles(): Promise<SharedFile[]> {
    const rows = await drizzleDb.select().from(schema.sharedFiles);
    return rows.map((r) => ({
      id: r.id,
      filename: r.filename,
      file_size: r.fileSize,
      mime_type: r.mimeType,
      file_url: r.fileUrl,
      created_at: r.createdAt ? r.createdAt.toISOString() : new Date().toISOString(),
    }));
  }

  async createFile(file: SharedFile): Promise<SharedFile> {
    await drizzleDb.insert(schema.sharedFiles).values({
      id: file.id,
      filename: file.filename,
      fileSize: file.file_size,
      mimeType: file.mime_type,
      fileUrl: file.file_url,
      createdAt: file.created_at ? new Date(file.created_at) : new Date(),
    });
    return file;
  }

  async getEntityFiles(entityId: string): Promise<SharedEntityFile[]> {
    const rows = await drizzleDb
      .select()
      .from(schema.sharedEntityFiles)
      .where(eq(schema.sharedEntityFiles.entityId, entityId));

    return rows.map((r) => ({
      id: r.id,
      entity_id: r.entityId,
      file_id: r.fileId,
      role: r.role as any,
    }));
  }

  async linkFileToEntity(link: SharedEntityFile): Promise<void> {
    await drizzleDb.insert(schema.sharedEntityFiles).values({
      id: link.id,
      entityId: link.entity_id,
      fileId: link.file_id,
      role: link.role,
    });
  }
}

// ==============================================================================
// 4. Domain Repositories (People, Places, Events, Knowledge, Buildings)
// ==============================================================================

export class PostgresPeopleRepository implements IPeopleRepository {
  async getAll(): Promise<PeoplePerson[]> {
    const rows = await drizzleDb.select().from(schema.people);
    return rows.map((r) => ({
      id: r.id,
      first_name: r.firstName,
      last_name: r.lastName,
      nickname: r.nickname || undefined,
      birthdate: r.birthdate || undefined,
      bio: r.bio || undefined,
      avatar_url: r.avatarUrl || undefined,
      gender: r.gender || undefined,
      company: r.company || undefined,
      role_title: r.roleTitle || undefined,
      notes: r.notes || undefined,
    }));
  }

  async getById(id: string): Promise<PeoplePerson | null> {
    const rows = await drizzleDb.select().from(schema.people).where(eq(schema.people.id, id));
    if (!rows.length) return null;
    const r = rows[0];
    return {
      id: r.id,
      first_name: r.firstName,
      last_name: r.lastName,
      nickname: r.nickname || undefined,
      birthdate: r.birthdate || undefined,
      bio: r.bio || undefined,
      avatar_url: r.avatarUrl || undefined,
      gender: r.gender || undefined,
      company: r.company || undefined,
      role_title: r.roleTitle || undefined,
      notes: r.notes || undefined,
    };
  }

  async create(person: PeoplePerson): Promise<PeoplePerson> {
    await drizzleDb.insert(schema.people).values({
      id: person.id,
      firstName: person.first_name,
      lastName: person.last_name,
      nickname: person.nickname,
      birthdate: person.birthdate,
      bio: person.bio,
      avatarUrl: person.avatar_url,
      gender: person.gender,
      company: person.company,
      roleTitle: person.role_title,
      notes: person.notes,
    });
    return person;
  }

  async update(id: string, updates: Partial<PeoplePerson>): Promise<PeoplePerson | null> {
    const toUpdate: any = { updatedAt: new Date() };
    if (updates.first_name !== undefined) toUpdate.firstName = updates.first_name;
    if (updates.last_name !== undefined) toUpdate.lastName = updates.last_name;
    if (updates.nickname !== undefined) toUpdate.nickname = updates.nickname;
    if (updates.birthdate !== undefined) toUpdate.birthdate = updates.birthdate;
    if (updates.bio !== undefined) toUpdate.bio = updates.bio;
    if (updates.avatar_url !== undefined) toUpdate.avatarUrl = updates.avatar_url;
    if (updates.gender !== undefined) toUpdate.gender = updates.gender;
    if (updates.company !== undefined) toUpdate.company = updates.company;
    if (updates.role_title !== undefined) toUpdate.roleTitle = updates.role_title;
    if (updates.notes !== undefined) toUpdate.notes = updates.notes;

    await drizzleDb.update(schema.people).set(toUpdate).where(eq(schema.people.id, id));
    return this.getById(id);
  }

  async delete(id: string): Promise<boolean> {
    await drizzleDb.delete(schema.peopleContacts).where(eq(schema.peopleContacts.personId, id));
    await drizzleDb
      .delete(schema.peopleRelationships)
      .where(
        or(
          eq(schema.peopleRelationships.personAId, id),
          eq(schema.peopleRelationships.personBId, id)
        )
      );
    const res = await drizzleDb.delete(schema.people).where(eq(schema.people.id, id)).returning();
    return res.length > 0;
  }

  async getContacts(personId: string): Promise<PeopleContact[]> {
    const rows = await drizzleDb
      .select()
      .from(schema.peopleContacts)
      .where(eq(schema.peopleContacts.personId, personId));

    return rows.map((r) => ({
      id: r.id,
      person_id: r.personId,
      type: r.type as any,
      value: r.value,
      label: r.label,
      is_primary: r.isPrimary,
    }));
  }

  async addContact(contact: PeopleContact): Promise<PeopleContact> {
    await drizzleDb.insert(schema.peopleContacts).values({
      id: contact.id,
      personId: contact.person_id,
      type: contact.type,
      value: contact.value,
      label: contact.label,
      isPrimary: contact.is_primary,
    });
    return contact;
  }

  async deleteContact(id: string): Promise<boolean> {
    const res = await drizzleDb.delete(schema.peopleContacts).where(eq(schema.peopleContacts.id, id)).returning();
    return res.length > 0;
  }

  async getRelationships(personId: string): Promise<PeopleRelationship[]> {
    const rows = await drizzleDb
      .select()
      .from(schema.peopleRelationships)
      .where(
        or(
          eq(schema.peopleRelationships.personAId, personId),
          eq(schema.peopleRelationships.personBId, personId)
        )
      );

    return rows.map((r) => ({
      id: r.id,
      person_a_id: r.personAId,
      person_b_id: r.personBId,
      relationship_type: r.relationshipType,
      notes: r.notes || undefined,
    }));
  }

  async addRelationship(rel: PeopleRelationship): Promise<PeopleRelationship> {
    await drizzleDb.insert(schema.peopleRelationships).values({
      id: rel.id,
      personAId: rel.person_a_id,
      personBId: rel.person_b_id,
      relationshipType: rel.relationship_type,
      notes: rel.notes,
    });
    return rel;
  }

  async deleteRelationship(id: string): Promise<boolean> {
    const res = await drizzleDb
      .delete(schema.peopleRelationships)
      .where(eq(schema.peopleRelationships.id, id))
      .returning();
    return res.length > 0;
  }
}

export class PostgresPlacesRepository implements IPlacesRepository {
  async getAll(): Promise<PlacesPlace[]> {
    const rows = await drizzleDb.select().from(schema.places);
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      category: r.category as any,
      address: r.address || undefined,
      latitude: r.latitude,
      longitude: r.longitude,
      altitude: r.altitude ?? undefined,
      description: r.description || undefined,
      opening_hours: r.openingHours || undefined,
      website: r.website || undefined,
      phone: r.phone || undefined,
    }));
  }

  async getById(id: string): Promise<PlacesPlace | null> {
    const rows = await drizzleDb.select().from(schema.places).where(eq(schema.places.id, id));
    if (!rows.length) return null;
    const r = rows[0];
    return {
      id: r.id,
      name: r.name,
      category: r.category as any,
      address: r.address || undefined,
      latitude: r.latitude,
      longitude: r.longitude,
      altitude: r.altitude ?? undefined,
      description: r.description || undefined,
      opening_hours: r.openingHours || undefined,
      website: r.website || undefined,
      phone: r.phone || undefined,
    };
  }

  async create(place: PlacesPlace): Promise<PlacesPlace> {
    await drizzleDb.insert(schema.places).values({
      id: place.id,
      name: place.name,
      category: place.category,
      address: place.address,
      latitude: place.latitude,
      longitude: place.longitude,
      altitude: place.altitude,
      description: place.description,
      openingHours: place.opening_hours,
      website: place.website,
      phone: place.phone,
    });
    return place;
  }

  async update(id: string, updates: Partial<PlacesPlace>): Promise<PlacesPlace | null> {
    const toUpdate: any = { updatedAt: new Date() };
    if (updates.name !== undefined) toUpdate.name = updates.name;
    if (updates.category !== undefined) toUpdate.category = updates.category;
    if (updates.address !== undefined) toUpdate.address = updates.address;
    if (updates.latitude !== undefined) toUpdate.latitude = updates.latitude;
    if (updates.longitude !== undefined) toUpdate.longitude = updates.longitude;
    if (updates.altitude !== undefined) toUpdate.altitude = updates.altitude;
    if (updates.description !== undefined) toUpdate.description = updates.description;
    if (updates.opening_hours !== undefined) toUpdate.openingHours = updates.opening_hours;
    if (updates.website !== undefined) toUpdate.website = updates.website;
    if (updates.phone !== undefined) toUpdate.phone = updates.phone;

    await drizzleDb.update(schema.places).set(toUpdate).where(eq(schema.places.id, id));
    return this.getById(id);
  }

  async delete(id: string): Promise<boolean> {
    await drizzleDb.delete(schema.placesVisits).where(eq(schema.placesVisits.placeId, id));
    const res = await drizzleDb.delete(schema.places).where(eq(schema.places.id, id)).returning();
    return res.length > 0;
  }

  async getVisits(placeId: string): Promise<PlacesVisit[]> {
    const rows = await drizzleDb.select().from(schema.placesVisits).where(eq(schema.placesVisits.placeId, placeId));
    return rows.map((r) => ({
      id: r.id,
      place_id: r.placeId,
      visited_at: r.visitedAt ? r.visitedAt.toISOString() : new Date().toISOString(),
      rating: r.rating ?? undefined,
      notes: r.notes || undefined,
      photos: (r.photos as string[]) || undefined,
    }));
  }

  async addVisit(visit: PlacesVisit): Promise<PlacesVisit> {
    await drizzleDb.insert(schema.placesVisits).values({
      id: visit.id,
      placeId: visit.place_id,
      visitedAt: new Date(visit.visited_at),
      rating: visit.rating,
      notes: visit.notes,
      photos: visit.photos,
    });
    return visit;
  }

  async deleteVisit(id: string): Promise<boolean> {
    const res = await drizzleDb.delete(schema.placesVisits).where(eq(schema.placesVisits.id, id)).returning();
    return res.length > 0;
  }
}

export class PostgresEventsRepository implements IEventsRepository {
  async getAll(): Promise<EventsEvent[]> {
    const rows = await drizzleDb.select().from(schema.events);
    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description || undefined,
      start_time: r.startTime,
      end_time: r.endTime || undefined,
      is_all_day: r.isAllDay,
      place_id: r.placeId || undefined,
      status: r.status as any,
      recurrence: r.recurrence as any,
    }));
  }

  async getById(id: string): Promise<EventsEvent | null> {
    const rows = await drizzleDb.select().from(schema.events).where(eq(schema.events.id, id));
    if (!rows.length) return null;
    const r = rows[0];
    return {
      id: r.id,
      title: r.title,
      description: r.description || undefined,
      start_time: r.startTime,
      end_time: r.endTime || undefined,
      is_all_day: r.isAllDay,
      place_id: r.placeId || undefined,
      status: r.status as any,
      recurrence: r.recurrence as any,
    };
  }

  async create(event: EventsEvent): Promise<EventsEvent> {
    await drizzleDb.insert(schema.events).values({
      id: event.id,
      title: event.title,
      description: event.description,
      startTime: event.start_time,
      endTime: event.end_time,
      isAllDay: event.is_all_day,
      placeId: event.place_id,
      status: event.status,
      recurrence: event.recurrence,
    });
    return event;
  }

  async update(id: string, updates: Partial<EventsEvent>): Promise<EventsEvent | null> {
    const toUpdate: any = { updatedAt: new Date() };
    if (updates.title !== undefined) toUpdate.title = updates.title;
    if (updates.description !== undefined) toUpdate.description = updates.description;
    if (updates.start_time !== undefined) toUpdate.startTime = updates.start_time;
    if (updates.end_time !== undefined) toUpdate.endTime = updates.end_time;
    if (updates.is_all_day !== undefined) toUpdate.isAllDay = updates.is_all_day;
    if (updates.place_id !== undefined) toUpdate.placeId = updates.place_id;
    if (updates.status !== undefined) toUpdate.status = updates.status;
    if (updates.recurrence !== undefined) toUpdate.recurrence = updates.recurrence;

    await drizzleDb.update(schema.events).set(toUpdate).where(eq(schema.events.id, id));
    return this.getById(id);
  }

  async delete(id: string): Promise<boolean> {
    await drizzleDb.delete(schema.eventsParticipants).where(eq(schema.eventsParticipants.eventId, id));
    const res = await drizzleDb.delete(schema.events).where(eq(schema.events.id, id)).returning();
    return res.length > 0;
  }

  async getParticipants(eventId: string): Promise<EventsParticipant[]> {
    const rows = await drizzleDb
      .select()
      .from(schema.eventsParticipants)
      .where(eq(schema.eventsParticipants.eventId, eventId));

    return rows.map((r) => ({
      id: r.id,
      event_id: r.eventId,
      person_id: r.personId,
      role: r.role as any,
      status: r.status as any,
    }));
  }

  async addParticipant(participant: EventsParticipant): Promise<EventsParticipant> {
    await drizzleDb.insert(schema.eventsParticipants).values({
      id: participant.id,
      eventId: participant.event_id,
      personId: participant.person_id,
      role: participant.role,
      status: participant.status,
    });
    return participant;
  }

  async removeParticipant(id: string): Promise<boolean> {
    const res = await drizzleDb
      .delete(schema.eventsParticipants)
      .where(eq(schema.eventsParticipants.id, id))
      .returning();
    return res.length > 0;
  }
}

export class PostgresKnowledgeRepository implements IKnowledgeRepository {
  async getAll(): Promise<KnowledgeItem[]> {
    const rows = await drizzleDb.select().from(schema.knowledgeItems);
    return rows.map((r) => ({
      id: r.id,
      entity_type_id: r.entityTypeId,
      title: r.title,
      description: r.description || undefined,
      notes: r.notes || undefined,
      properties: (r.properties as Record<string, any>) || {},
    }));
  }

  async getById(id: string): Promise<KnowledgeItem | null> {
    const rows = await drizzleDb.select().from(schema.knowledgeItems).where(eq(schema.knowledgeItems.id, id));
    if (!rows.length) return null;
    const r = rows[0];
    return {
      id: r.id,
      entity_type_id: r.entityTypeId,
      title: r.title,
      description: r.description || undefined,
      notes: r.notes || undefined,
      properties: (r.properties as Record<string, any>) || {},
    };
  }

  async getByEntityType(entityTypeId: string): Promise<KnowledgeItem[]> {
    const rows = await drizzleDb
      .select()
      .from(schema.knowledgeItems)
      .where(eq(schema.knowledgeItems.entityTypeId, entityTypeId));

    return rows.map((r) => ({
      id: r.id,
      entity_type_id: r.entityTypeId,
      title: r.title,
      description: r.description || undefined,
      notes: r.notes || undefined,
      properties: (r.properties as Record<string, any>) || {},
    }));
  }

  async create(item: KnowledgeItem): Promise<KnowledgeItem> {
    await drizzleDb.insert(schema.knowledgeItems).values({
      id: item.id,
      entityTypeId: item.entity_type_id,
      title: item.title,
      description: item.description,
      notes: item.notes,
      properties: item.properties,
    });
    return item;
  }

  async update(id: string, updates: Partial<KnowledgeItem>): Promise<KnowledgeItem | null> {
    const toUpdate: any = { updatedAt: new Date() };
    if (updates.title !== undefined) toUpdate.title = updates.title;
    if (updates.description !== undefined) toUpdate.description = updates.description;
    if (updates.notes !== undefined) toUpdate.notes = updates.notes;
    if (updates.properties !== undefined) toUpdate.properties = updates.properties;
    if (updates.entity_type_id !== undefined) toUpdate.entityTypeId = updates.entity_type_id;

    await drizzleDb.update(schema.knowledgeItems).set(toUpdate).where(eq(schema.knowledgeItems.id, id));
    return this.getById(id);
  }

  async delete(id: string): Promise<boolean> {
    const res = await drizzleDb.delete(schema.knowledgeItems).where(eq(schema.knowledgeItems.id, id)).returning();
    return res.length > 0;
  }
}

export class PostgresBuildingsRepository implements IBuildingsRepository {
  async getAll(): Promise<BuildingsBuilding[]> {
    const rows = await drizzleDb.select().from(schema.buildings);
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      code: r.code,
      building_type: r.buildingType as any,
      address: r.address || undefined,
      place_id: r.placeId || undefined,
      manager_person_id: r.managerPersonId || undefined,
      floors_count: r.floorsCount,
      total_area_sqm: r.totalAreaSqm,
      notes: r.notes || undefined,
    }));
  }

  async getById(id: string): Promise<BuildingsBuilding | null> {
    const rows = await drizzleDb.select().from(schema.buildings).where(eq(schema.buildings.id, id));
    if (!rows.length) return null;
    const r = rows[0];
    return {
      id: r.id,
      name: r.name,
      code: r.code,
      building_type: r.buildingType as any,
      address: r.address || undefined,
      place_id: r.placeId || undefined,
      manager_person_id: r.managerPersonId || undefined,
      floors_count: r.floorsCount,
      total_area_sqm: r.totalAreaSqm,
      notes: r.notes || undefined,
    };
  }

  async create(building: BuildingsBuilding): Promise<BuildingsBuilding> {
    await drizzleDb.insert(schema.buildings).values({
      id: building.id,
      name: building.name,
      code: building.code,
      buildingType: building.building_type,
      address: building.address,
      placeId: building.place_id,
      managerPersonId: building.manager_person_id,
      floorsCount: building.floors_count,
      totalAreaSqm: building.total_area_sqm,
      notes: building.notes,
    });
    return building;
  }

  async update(id: string, updates: Partial<BuildingsBuilding>): Promise<BuildingsBuilding | null> {
    const toUpdate: any = { updatedAt: new Date() };
    if (updates.name !== undefined) toUpdate.name = updates.name;
    if (updates.code !== undefined) toUpdate.code = updates.code;
    if (updates.building_type !== undefined) toUpdate.buildingType = updates.building_type;
    if (updates.address !== undefined) toUpdate.address = updates.address;
    if (updates.place_id !== undefined) toUpdate.placeId = updates.place_id;
    if (updates.manager_person_id !== undefined) toUpdate.managerPersonId = updates.manager_person_id;
    if (updates.floors_count !== undefined) toUpdate.floorsCount = updates.floors_count;
    if (updates.total_area_sqm !== undefined) toUpdate.totalAreaSqm = updates.total_area_sqm;
    if (updates.notes !== undefined) toUpdate.notes = updates.notes;

    await drizzleDb.update(schema.buildings).set(toUpdate).where(eq(schema.buildings.id, id));
    return this.getById(id);
  }

  async delete(id: string): Promise<boolean> {
    const res = await drizzleDb.delete(schema.buildings).where(eq(schema.buildings.id, id)).returning();
    return res.length > 0;
  }
}

// ==============================================================================
// 5. Extensions Repository
// ==============================================================================

export class PostgresExtensionsRepository implements IExtensionsRepository {
  async getAll(): Promise<TechnicalExtension[]> {
    const rows = await drizzleDb.select().from(schema.technicalExtensions);
    return rows.map((r) => ({
      id: r.id,
      code: r.code,
      name: r.name,
      type: r.type as any,
      description: r.description,
      is_enabled: r.isEnabled,
      version: r.version,
      sub_components: (r.subComponents as string[]) || undefined,
      parent_extension: r.parentExtension || undefined,
      status: r.status as any,
    }));
  }

  async getByCode(code: string): Promise<TechnicalExtension | null> {
    const rows = await drizzleDb
      .select()
      .from(schema.technicalExtensions)
      .where(eq(schema.technicalExtensions.code, code));

    if (!rows.length) return null;
    const r = rows[0];
    return {
      id: r.id,
      code: r.code,
      name: r.name,
      type: r.type as any,
      description: r.description,
      is_enabled: r.isEnabled,
      version: r.version,
      sub_components: (r.subComponents as string[]) || undefined,
      parent_extension: r.parentExtension || undefined,
      status: r.status as any,
    };
  }

  async toggle(code: string, enabled: boolean): Promise<TechnicalExtension | null> {
    await drizzleDb
      .update(schema.technicalExtensions)
      .set({
        isEnabled: enabled,
        status: enabled ? 'active' : 'disabled',
      })
      .where(eq(schema.technicalExtensions.code, code));

    return this.getByCode(code);
  }
}

/**
 * Ensures foundational system baseline records (roles, permissions, extensions, settings, link types, meta types)
 * are populated when connecting to a fresh PostgreSQL instance.
 */
export async function ensurePostgresBaselineSeeded(): Promise<void> {
  try {
    // 1. Roles
    await drizzleDb
      .insert(schema.roles)
      .values([
        {
          id: 'admin',
          name: 'Administrator',
          description: 'Full system control, module configuration, user management and audit log access',
          isAdmin: true,
        },
        {
          id: 'member',
          name: 'Member',
          description: 'Can create and edit entities across all enabled modules',
          isAdmin: false,
        },
        {
          id: 'guest',
          name: 'Guest (Read Only)',
          description: 'Can view enabled modules and search items',
          isAdmin: false,
        },
      ])
      .onConflictDoNothing();

    const permKeys = ['read', 'write', 'delete', 'admin', 'export', 'audit', 'manage_users'];
    const permsToInsert: Array<{ id: string; roleId: string; permissionKey: string; allowed: boolean }> = [];
    for (const pk of permKeys) {
      permsToInsert.push({ id: `perm_admin_${pk}`, roleId: 'admin', permissionKey: pk, allowed: true });
      permsToInsert.push({
        id: `perm_member_${pk}`,
        roleId: 'member',
        permissionKey: pk,
        allowed: ['read', 'write', 'delete', 'export'].includes(pk),
      });
      permsToInsert.push({
        id: `perm_guest_${pk}`,
        roleId: 'guest',
        permissionKey: pk,
        allowed: ['read', 'export'].includes(pk),
      });
    }
    await drizzleDb.insert(schema.rolePermissions).values(permsToInsert).onConflictDoNothing();

    // 2. Settings
    await drizzleDb
      .insert(schema.settings)
      .values([
        { key: 'multi_user_enabled', value: true, description: 'Allow multiple user accounts', updatedAt: new Date() },
        { key: 'default_role', value: 'member', description: 'Default role for new users', updatedAt: new Date() },
        { key: 'allow_registration', value: false, description: 'Allow public self-registration', updatedAt: new Date() },
        { key: 'storage_quota_mb', value: 4096, description: 'Instance storage quota in MB', updatedAt: new Date() },
        { key: 'language', value: 'it', description: 'System interface language', updatedAt: new Date() },
      ])
      .onConflictDoNothing();

    // 3. Technical Extensions
    await drizzleDb
      .insert(schema.technicalExtensions)
      .values([
        {
          id: 'ext_postgis',
          code: 'maps',
          name: 'PostGIS Spatial Engine',
          type: 'atomic',
          description: 'Enables spatial queries, geographic indexing, and interactive mapping features.',
          isEnabled: true,
          version: '3.4.1',
          status: 'active',
        },
        {
          id: 'ext_pg_trgm',
          code: 'pg_trgm',
          name: 'pg_trgm Full-Text & Fuzzy Search',
          type: 'atomic',
          description: 'Trigram fuzzy text search across all notes, contact profiles, and knowledge properties.',
          isEnabled: true,
          version: '1.6',
          status: 'active',
        },
        {
          id: 'ext_timescale',
          code: 'timescale',
          name: 'TimescaleDB Temporal Series',
          type: 'atomic',
          description: 'Optimized time-series database chunks for IoT sensor telemetry and health tracking.',
          isEnabled: false,
          version: '2.14.0',
          status: 'disabled',
        },
        {
          id: 'ext_pgvector',
          code: 'pgvector',
          name: 'pgvector Semantic Embeddings',
          type: 'atomic',
          description: 'Vector similarity search for local AI semantic second brain retrieval.',
          isEnabled: false,
          version: '0.6.0',
          status: 'disabled',
        },
      ])
      .onConflictDoNothing();

    // 4. Shared Tags
    await drizzleDb
      .insert(schema.sharedTags)
      .values([
        { id: 'tag_tech', name: 'Technology', color: '#3b82f6' },
        { id: 'tag_hardware', name: 'Hardware', color: '#10b981' },
        { id: 'tag_work', name: 'Work', color: '#8b5cf6' },
        { id: 'tag_personal', name: 'Personal', color: '#f59e0b' },
        { id: 'tag_travel', name: 'Travel', color: '#ec4899' },
        { id: 'tag_urgent', name: 'Urgent', color: '#ef4444' },
        { id: 'tag_culinary', name: 'Culinary', color: '#14b8a6' },
      ])
      .onConflictDoNothing();

    // 5. Shared Link Types
    await drizzleDb
      .insert(schema.sharedLinkTypes)
      .values([
        { id: 'lt_related_to', code: 'related_to', forwardLabel: 'is related to', reverseLabel: 'is related to' },
        { id: 'lt_works_at', code: 'works_at', forwardLabel: 'works at', reverseLabel: 'employs' },
        { id: 'lt_located_at', code: 'located_at', forwardLabel: 'is located at', reverseLabel: 'hosts' },
        { id: 'lt_participates_in', code: 'participates_in', forwardLabel: 'participates in', reverseLabel: 'has participant' },
        { id: 'lt_manages', code: 'manages', forwardLabel: 'manages', reverseLabel: 'is managed by' },
        { id: 'lt_owns', code: 'owns', forwardLabel: 'owns', reverseLabel: 'is owned by' },
        { id: 'lt_friend_of', code: 'friend_of', forwardLabel: 'is friend of', reverseLabel: 'is friend of' },
      ])
      .onConflictDoNothing();

    // 6. Meta Entity Types
    await drizzleDb
      .insert(schema.metaEntityTypes)
      .values([
        {
          id: 'metatype_book',
          name: 'Book',
          code: 'book',
          icon: 'BookOpen',
          description: 'Literature, manuals, and study guides with ISBN and rating',
          schemaVersion: 1,
        },
        {
          id: 'metatype_hardware_gear',
          name: 'Hardware & Gear',
          code: 'hardware_gear',
          icon: 'Cpu',
          description: 'Computing hardware, SBCs, tools, and electronics with serial numbers',
          schemaVersion: 1,
        },
        {
          id: 'metatype_software_app',
          name: 'Software & Tools',
          code: 'software_app',
          icon: 'Code2',
          description: 'Software repositories, desktop tools, and self-hosted docker images',
          schemaVersion: 1,
        },
        {
          id: 'metatype_recipe',
          name: 'Culinary Recipe',
          code: 'recipe',
          icon: 'Utensils',
          description: 'Cooking ingredients, preparation steps, and dietary tags',
          schemaVersion: 1,
        },
      ])
      .onConflictDoNothing();
  } catch (err) {
    console.warn('[Postgres Baseline Seed Warning]:', err);
  }
}
