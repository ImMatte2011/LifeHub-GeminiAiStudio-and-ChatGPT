import { db as inMemoryDb } from '../database.js';
import { db as drizzleDb, checkPostgresConnection } from '../../../src/db/index.js';
import * as schema from '../../../src/db/schema.js';

export interface MigrationSummary {
  success: boolean;
  counts: Record<string, number>;
  errors: string[];
}

/**
 * Idempotently migrates all in-memory / JSON / WAL data from LifeHubDatabase into PostgreSQL.
 */
export async function migrateMemoryToPostgres(): Promise<MigrationSummary> {
  const status = await checkPostgresConnection();
  if (!status.connected) {
    return {
      success: false,
      counts: {},
      errors: [`Cannot connect to PostgreSQL: ${status.error}`],
    };
  }

  const counts: Record<string, number> = {};
  const errors: string[] = [];

  try {
    // 1. Roles & Permissions
    for (const role of inMemoryDb.roles.values()) {
      await drizzleDb
        .insert(schema.roles)
        .values({
          id: role.id,
          name: role.name,
          description: role.description,
          isAdmin: role.is_admin,
        })
        .onConflictDoNothing();
      counts['roles'] = (counts['roles'] || 0) + 1;
    }

    for (const perm of inMemoryDb.rolePermissions.values()) {
      await drizzleDb
        .insert(schema.rolePermissions)
        .values({
          id: perm.id,
          roleId: perm.role_id,
          permissionKey: perm.permission_key,
          allowed: perm.allowed,
        })
        .onConflictDoNothing();
      counts['rolePermissions'] = (counts['rolePermissions'] || 0) + 1;
    }

    // 2. Users
    for (const u of inMemoryDb.users.values()) {
      await drizzleDb
        .insert(schema.users)
        .values({
          id: u.id,
          username: u.username,
          email: u.email,
          passwordHash: u.password_hash,
          fullName: u.full_name,
          avatarUrl: u.avatar_url,
          roleId: u.role_id,
          isActive: u.is_active,
          createdAt: u.created_at ? new Date(u.created_at) : new Date(),
          lastLogin: u.last_login ? new Date(u.last_login) : null,
        })
        .onConflictDoUpdate({
          target: schema.users.id,
          set: {
            passwordHash: u.password_hash,
            fullName: u.full_name,
            lastLogin: u.last_login ? new Date(u.last_login) : null,
          },
        });
      counts['users'] = (counts['users'] || 0) + 1;
    }

    // 3. Settings & Modules
    for (const s of inMemoryDb.settings.values()) {
      await drizzleDb
        .insert(schema.settings)
        .values({
          key: s.key,
          value: s.value,
          description: s.description,
          updatedAt: s.updated_at ? new Date(s.updated_at) : new Date(),
        })
        .onConflictDoNothing();
      counts['settings'] = (counts['settings'] || 0) + 1;
    }

    for (const m of inMemoryDb.modules.values()) {
      await drizzleDb
        .insert(schema.modules)
        .values({
          id: m.id,
          name: m.name,
          description: m.description,
          icon: m.icon,
          isEnabled: m.is_enabled,
          version: m.version,
          requiredExtensions: m.required_extensions,
        })
        .onConflictDoNothing();
      counts['modules'] = (counts['modules'] || 0) + 1;
    }

    // 4. Core Entities
    for (const e of inMemoryDb.entities.values()) {
      await drizzleDb
        .insert(schema.entities)
        .values({
          id: e.id,
          entityType: e.entity_type,
          title: e.title,
          createdAt: e.created_at ? new Date(e.created_at) : new Date(),
          updatedAt: e.updated_at ? new Date(e.updated_at) : new Date(),
          createdBy: e.created_by,
        })
        .onConflictDoNothing();
      counts['entities'] = (counts['entities'] || 0) + 1;
    }

    // 5. Meta Layer
    for (const mt of inMemoryDb.entityTypes.values()) {
      await drizzleDb
        .insert(schema.metaEntityTypes)
        .values({
          id: mt.id,
          code: mt.code,
          name: mt.name,
          icon: mt.icon,
          description: mt.description,
          schemaVersion: mt.schema_version,
        })
        .onConflictDoNothing();
      counts['metaEntityTypes'] = (counts['metaEntityTypes'] || 0) + 1;
    }

    for (const mg of inMemoryDb.propertyGroups.values()) {
      await drizzleDb
        .insert(schema.metaPropertyGroups)
        .values({
          id: mg.id,
          entityTypeId: mg.entity_type_id,
          name: mg.name,
          sortOrder: mg.sort_order,
        })
        .onConflictDoNothing();
      counts['metaPropertyGroups'] = (counts['metaPropertyGroups'] || 0) + 1;
    }

    for (const mp of inMemoryDb.propertyDefinitions.values()) {
      await drizzleDb
        .insert(schema.metaPropertyDefinitions)
        .values({
          id: mp.id,
          entityTypeId: mp.entity_type_id,
          code: mp.code,
          label: mp.label,
          dataType: mp.data_type,
          isRequired: mp.is_required,
          sortOrder: mp.sort_order,
          enumValues: mp.enum_values,
          groupId: mp.group_id,
          defaultValue: mp.default_value,
        })
        .onConflictDoNothing();
      counts['metaPropertyDefinitions'] = (counts['metaPropertyDefinitions'] || 0) + 1;
    }

    // 6. Shared Layer
    for (const t of inMemoryDb.tags.values()) {
      await drizzleDb
        .insert(schema.sharedTags)
        .values({
          id: t.id,
          name: t.name,
          color: t.color,
          icon: t.icon,
        })
        .onConflictDoNothing();
      counts['sharedTags'] = (counts['sharedTags'] || 0) + 1;
    }

    for (const lt of inMemoryDb.linkTypes.values()) {
      await drizzleDb
        .insert(schema.sharedLinkTypes)
        .values({
          id: lt.id,
          code: lt.code,
          forwardLabel: lt.forward_label,
          reverseLabel: lt.reverse_label,
        })
        .onConflictDoNothing();
      counts['sharedLinkTypes'] = (counts['sharedLinkTypes'] || 0) + 1;
    }

    // 7. Domain Modules
    for (const p of inMemoryDb.people.values()) {
      await drizzleDb
        .insert(schema.people)
        .values({
          id: p.id,
          firstName: p.first_name,
          lastName: p.last_name,
          nickname: p.nickname,
          birthdate: p.birthdate,
          bio: p.bio,
          avatarUrl: p.avatar_url,
          gender: p.gender,
          company: p.company,
          roleTitle: p.role_title,
          notes: p.notes,
        })
        .onConflictDoNothing();
      counts['people'] = (counts['people'] || 0) + 1;
    }

    for (const pl of inMemoryDb.places.values()) {
      await drizzleDb
        .insert(schema.places)
        .values({
          id: pl.id,
          name: pl.name,
          category: pl.category,
          address: pl.address,
          latitude: pl.latitude,
          longitude: pl.longitude,
          altitude: pl.altitude,
          description: pl.description,
          openingHours: pl.opening_hours,
          website: pl.website,
          phone: pl.phone,
          notes: pl.description,
        })
        .onConflictDoNothing();
      counts['places'] = (counts['places'] || 0) + 1;
    }

    for (const ev of inMemoryDb.events.values()) {
      await drizzleDb
        .insert(schema.events)
        .values({
          id: ev.id,
          title: ev.title,
          description: ev.description,
          startTime: ev.start_time,
          endTime: ev.end_time,
          isAllDay: ev.is_all_day,
          placeId: ev.place_id,
          status: ev.status,
          recurrence: ev.recurrence,
        })
        .onConflictDoNothing();
      counts['events'] = (counts['events'] || 0) + 1;
    }

    for (const ki of inMemoryDb.knowledgeItems.values()) {
      await drizzleDb
        .insert(schema.knowledgeItems)
        .values({
          id: ki.id,
          entityTypeId: ki.entity_type_id,
          title: ki.title,
          description: ki.description,
          notes: ki.notes,
          properties: ki.properties,
        })
        .onConflictDoNothing();
      counts['knowledgeItems'] = (counts['knowledgeItems'] || 0) + 1;
    }

    for (const b of inMemoryDb.buildings.values()) {
      await drizzleDb
        .insert(schema.buildings)
        .values({
          id: b.id,
          name: b.name,
          code: b.code,
          buildingType: b.building_type,
          address: b.address,
          placeId: b.place_id,
          managerPersonId: b.manager_person_id,
          floorsCount: b.floors_count,
          totalAreaSqm: b.total_area_sqm,
          notes: b.notes,
        })
        .onConflictDoNothing();
      counts['buildings'] = (counts['buildings'] || 0) + 1;
    }

    return {
      success: true,
      counts,
      errors,
    };
  } catch (err: any) {
    errors.push(err?.message || 'Migration error');
    return {
      success: false,
      counts,
      errors,
    };
  }
}
