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
  InstanceConfig,
} from './types.js';

// Haversine formula to calculate distance between two lat/lng coordinates in kilometers
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
}

// Trigram generator for pg_trgm fuzzy similarity matching
function getTrigrams(str: string): Set<string> {
  const s = `  ${str.toLowerCase()}  `;
  const trigrams = new Set<string>();
  for (let i = 0; i < s.length - 2; i++) {
    trigrams.add(s.substring(i, i + 3));
  }
  return trigrams;
}

// pg_trgm similarity coefficient (0 to 1)
export function calculateSimilarity(s1: string, s2: string): number {
  if (!s1 || !s2) return 0;
  if (s1.toLowerCase() === s2.toLowerCase()) return 1.0;
  const tri1 = getTrigrams(s1);
  const tri2 = getTrigrams(s2);
  let intersection = 0;
  for (const t of tri1) {
    if (tri2.has(t)) intersection++;
  }
  return (2 * intersection) / (tri1.size + tri2.size);
}

export class LifeHubDatabase {
  // Core Schema
  users: Map<string, CoreUser> = new Map();
  roles: Map<string, CoreRole> = new Map();
  rolePermissions: Map<string, CoreRolePermission> = new Map();
  sessions: Map<string, CoreSession> = new Map();
  settings: Map<string, CoreSetting> = new Map();
  entities: Map<string, CoreEntity> = new Map();
  modules: Map<string, CoreModule> = new Map();
  auditLog: CoreAuditLog[] = [];

  // Meta Schema
  entityTypes: Map<string, MetaEntityType> = new Map();
  propertyDefinitions: Map<string, MetaPropertyDefinition> = new Map();
  propertyGroups: Map<string, MetaPropertyGroup> = new Map();

  // Shared Schema
  tags: Map<string, SharedTag> = new Map();
  entityTags: SharedEntityTag[] = [];
  linkTypes: Map<string, SharedLinkType> = new Map();
  links: SharedLink[] = [];
  files: Map<string, SharedFile> = new Map();
  entityFiles: SharedEntityFile[] = [];

  // Domain Schemas
  people: Map<string, PeoplePerson> = new Map();
  contacts: Map<string, PeopleContact> = new Map();
  relationships: PeopleRelationship[] = [];

  places: Map<string, PlacesPlace> = new Map();
  visits: PlacesVisit[] = [];

  events: Map<string, EventsEvent> = new Map();
  participants: EventsParticipant[] = [];

  knowledgeItems: Map<string, KnowledgeItem> = new Map();

  buildings: Map<string, BuildingsBuilding> = new Map();

  // Extensions
  extensions: Map<string, TechnicalExtension> = new Map();

  // Instance Config
  instanceConfig: InstanceConfig = {
    instance: {
      name: 'LifeHub',
      description: 'Personal information platform for self-hosting',
      host_env: 'Raspberry Pi 4 (8GB RAM / SATA III SSD)',
      version: '1.0.0-rc1',
    },
    modules: {
      people: true,
      places: true,
      events: true,
      knowledge: true,
      buildings: false,
    },
    extensions: {
      maps: true,
      pg_trgm: true,
    },
    settings: {
      multi_user_enabled: true,
      default_role: 'member',
      allow_registration: false,
      storage_quota_mb: 4096,
      language: 'it',
    },
  };

  constructor() {
    this.seedInitialData();
  }

  // Audit Logging
  logAudit(
    userId: string,
    action: CoreAuditLog['action'],
    details: string,
    entityId?: string,
    entityType?: string,
    metadata?: Record<string, any>
  ) {
    const user = this.users.get(userId);
    const log: CoreAuditLog = {
      id: 'audit_' + Math.random().toString(36).substring(2, 9),
      user_id: userId,
      username: user ? user.username : 'system',
      action,
      entity_id: entityId,
      entity_type: entityType,
      details,
      metadata,
      timestamp: new Date().toISOString(),
    };
    this.auditLog.unshift(log);
    if (this.auditLog.length > 500) {
      this.auditLog.pop();
    }
  }

  // Core Entity Registration helper
  registerEntity(
    id: string,
    entity_type: string,
    title: string,
    userId = 'user_admin'
  ): CoreEntity {
    const now = new Date().toISOString();
    const existing = this.entities.get(id);
    if (existing) {
      existing.title = title;
      existing.updated_at = now;
      return existing;
    }
    const entity: CoreEntity = {
      id,
      entity_type,
      title,
      created_at: now,
      updated_at: now,
      created_by: userId,
    };
    this.entities.set(id, entity);
    return entity;
  }

  deleteEntity(id: string) {
    this.entities.delete(id);
    // Cascade delete in shared
    this.entityTags = this.entityTags.filter((et) => et.entity_id !== id);
    this.links = this.links.filter(
      (l) => l.source_entity_id !== id && l.target_entity_id !== id
    );
    this.entityFiles = this.entityFiles.filter((ef) => ef.entity_id !== id);
  }

  // Tag Helpers
  addEntityTag(entityId: string, tagId: string) {
    if (!this.entityTags.some((et) => et.entity_id === entityId && et.tag_id === tagId)) {
      this.entityTags.push({
        id: 'et_' + Math.random().toString(36).substring(2, 9),
        entity_id: entityId,
        tag_id: tagId,
      });
    }
  }

  removeEntityTag(entityId: string, tagId: string) {
    this.entityTags = this.entityTags.filter(
      (et) => !(et.entity_id === entityId && et.tag_id === tagId)
    );
  }

  getEntityTags(entityId: string): SharedTag[] {
    const tagIds = this.entityTags
      .filter((et) => et.entity_id === entityId)
      .map((et) => et.tag_id);
    return tagIds.map((id) => this.tags.get(id)).filter(Boolean) as SharedTag[];
  }

  // Links Helpers
  addLink(sourceId: string, targetId: string, linkTypeId: string, notes?: string) {
    const link: SharedLink = {
      id: 'lnk_' + Math.random().toString(36).substring(2, 9),
      source_entity_id: sourceId,
      target_entity_id: targetId,
      link_type_id: linkTypeId,
      notes,
      created_at: new Date().toISOString(),
    };
    this.links.push(link);
    return link;
  }

  getEntityLinks(entityId: string) {
    const outgoing = this.links
      .filter((l) => l.source_entity_id === entityId)
      .map((l) => ({
        ...l,
        direction: 'outgoing' as const,
        target_entity: this.entities.get(l.target_entity_id),
        link_type: this.linkTypes.get(l.link_type_id),
      }));

    const incoming = this.links
      .filter((l) => l.target_entity_id === entityId)
      .map((l) => ({
        ...l,
        direction: 'incoming' as const,
        target_entity: this.entities.get(l.source_entity_id),
        link_type: this.linkTypes.get(l.link_type_id),
      }));

    return [...outgoing, ...incoming];
  }

  // Seed Initial Baseline Data
  private seedInitialData() {
    // 1. Roles
    this.roles.set('admin', {
      id: 'admin',
      name: 'Administrator',
      description: 'Full system control, module configuration, user management and audit log access',
      is_admin: true,
    });
    this.roles.set('member', {
      id: 'member',
      name: 'Member',
      description: 'Can create and edit entities across all enabled modules',
      is_admin: false,
    });
    this.roles.set('guest', {
      id: 'guest',
      name: 'Guest (Read Only)',
      description: 'Can view enabled modules and search items',
      is_admin: false,
    });

    // 2. Users
    this.users.set('user_admin', {
      id: 'user_admin',
      username: 'admin',
      email: 'admin@lifehub.local',
      password_hash: 'admin123',
      full_name: 'System Administrator',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      role_id: 'admin',
      is_active: true,
      created_at: '2026-01-01T00:00:00.000Z',
      last_login: new Date().toISOString(),
    });

    this.users.set('user_matteo', {
      id: 'user_matteo',
      username: 'matteo',
      email: 'al3ssandrini.m4tteo@gmail.com',
      password_hash: 'matteo123',
      full_name: 'Matteo Alessandrini',
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      role_id: 'admin',
      is_active: true,
      created_at: '2026-01-02T10:00:00.000Z',
      last_login: new Date().toISOString(),
    });

    this.users.set('user_guest', {
      id: 'user_guest',
      username: 'guest_visitor',
      email: 'guest@lifehub.local',
      password_hash: 'guest123',
      full_name: 'Guest Reviewer',
      avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
      role_id: 'guest',
      is_active: true,
      created_at: '2026-02-01T12:00:00.000Z',
    });

    // 3. Technical Extensions
    this.extensions.set('maps', {
      id: 'ext_maps',
      code: 'maps',
      name: 'Maps Capability Bundle',
      type: 'composite',
      description: 'Composite feature bundle providing interactive spatial visualization, GIS coordinates, and tile rendering.',
      is_enabled: true,
      version: '2.1.0',
      sub_components: ['postgis', 'leaflet', 'osm'],
      status: 'active',
    });

    this.extensions.set('postgis', {
      id: 'ext_postgis',
      code: 'postgis',
      name: 'PostGIS Spatial Engine',
      type: 'atomic',
      description: 'PostgreSQL spatial extension for geography(Point, 4326), bounding box calculation and GIST indexes.',
      is_enabled: true,
      version: '3.4.1',
      parent_extension: 'maps',
      status: 'active',
    });

    this.extensions.set('leaflet', {
      id: 'ext_leaflet',
      code: 'leaflet',
      name: 'Leaflet Interactive Map UI',
      type: 'atomic',
      description: 'Client-side vector mapping engine for interactive pan, zoom, custom markers, and geo-pinning.',
      is_enabled: true,
      version: '1.9.4',
      parent_extension: 'maps',
      status: 'active',
    });

    this.extensions.set('osm', {
      id: 'ext_osm',
      code: 'osm',
      name: 'OpenStreetMap Tile Provider',
      type: 'atomic',
      description: 'Cartographic map tile service providing vector and raster rendering layers.',
      is_enabled: true,
      version: '1.0.0',
      parent_extension: 'maps',
      status: 'active',
    });

    this.extensions.set('pg_trgm', {
      id: 'ext_pg_trgm',
      code: 'pg_trgm',
      name: 'pg_trgm Trigram Fuzzy Search',
      type: 'atomic',
      description: 'Trigram text similarity matching, fuzzy search tolerance, and typo-resilient auto-completion.',
      is_enabled: true,
      version: '1.6.0',
      status: 'active',
    });

    // 4. Core Modules
    this.modules.set('people', {
      id: 'people',
      name: 'People & Contacts',
      description: 'Personal CRM, relationships web, contact details, notes, and biographical links.',
      icon: 'Users',
      is_enabled: true,
      version: '1.2.0',
      required_extensions: [],
    });

    this.modules.set('places', {
      id: 'places',
      name: 'Places & Geodata',
      description: 'Geographic location registry, coordinate lookup, visits log, and spatial radius query.',
      icon: 'MapPin',
      is_enabled: true,
      version: '1.1.0',
      required_extensions: ['maps'],
    });

    this.modules.set('events', {
      id: 'events',
      name: 'Events & Timeline',
      description: 'Chronological timeline, calendar appointments, participant linkages, and duration tracking.',
      icon: 'Calendar',
      is_enabled: true,
      version: '1.0.0',
      required_extensions: [],
    });

    this.modules.set('knowledge', {
      id: 'knowledge',
      name: 'Knowledge & Items (JSONB)',
      description: 'Meta Layer-driven universal catalog. Dynamic types (books, hardware, software, recipes) with zero-DDL schema definitions.',
      icon: 'BookOpen',
      is_enabled: true,
      version: '2.0.0',
      required_extensions: [],
    });

    this.modules.set('buildings', {
      id: 'buildings',
      name: 'Buildings & Assets (Phase 12 Demo)',
      description: 'Modular reusability validation module: properties, rooms, facilities linked to people and geo-places.',
      icon: 'Building2',
      is_enabled: false,
      version: '0.9.0',
      required_extensions: ['maps'],
    });

    // 5. Shared Tags
    const tagsData = [
      { id: 'tag_work', name: 'Work', color: '#3b82f6', icon: 'Briefcase' },
      { id: 'tag_personal', name: 'Personal', color: '#10b981', icon: 'User' },
      { id: 'tag_tech', name: 'Tech & Code', color: '#8b5cf6', icon: 'Code' },
      { id: 'tag_travel', name: 'Travel', color: '#f59e0b', icon: 'Plane' },
      { id: 'tag_hardware', name: 'Hardware', color: '#ec4899', icon: 'Cpu' },
      { id: 'tag_urgent', name: 'Priority', color: '#ef4444', icon: 'AlertCircle' },
      { id: 'tag_culinary', name: 'Gastronomy', color: '#14b8a6', icon: 'Utensils' },
    ];
    for (const t of tagsData) this.tags.set(t.id, t);

    // 6. Shared Link Types
    const linkTypesData = [
      { id: 'lt_works_at', code: 'works_at', forward_label: 'Works at', reverse_label: 'Employs' },
      { id: 'lt_located_at', code: 'located_at', forward_label: 'Located at', reverse_label: 'Hosts' },
      { id: 'lt_attended', code: 'attended', forward_label: 'Participated in', reverse_label: 'Attendee' },
      { id: 'lt_authored', code: 'authored', forward_label: 'Created / Authored', reverse_label: 'Authored by' },
      { id: 'lt_related_to', code: 'related_to', forward_label: 'Related to', reverse_label: 'Linked with' },
      { id: 'lt_manages', code: 'manages', forward_label: 'Manages / Maintains', reverse_label: 'Managed by' },
    ];
    for (const lt of linkTypesData) this.linkTypes.set(lt.id, lt);

    // 7. Meta Entity Types (Knowledge Domains)
    const entityTypesData: MetaEntityType[] = [
      {
        id: 'meta_book',
        code: 'book',
        name: 'Book / Publication',
        icon: 'Book',
        description: 'Printed or digital books, reading notes, authors and ratings',
        schema_version: 1,
      },
      {
        id: 'meta_ammo',
        code: 'ammo',
        name: 'Ammunition & Ballistics',
        icon: 'Crosshair',
        description: 'Ammunition inventory, calibers, grain weights, and ballistics data',
        schema_version: 1,
      },
      {
        id: 'meta_software',
        code: 'software',
        name: 'Software & Open Source Tool',
        icon: 'Terminal',
        description: 'Applications, microservices, repositories, tech stacks and licenses',
        schema_version: 1,
      },
      {
        id: 'meta_recipe',
        code: 'recipe',
        name: 'Culinary Recipe',
        icon: 'UtensilsCrossed',
        description: 'Cooking recipes, ingredients lists, prep time and instructions',
        schema_version: 1,
      },
    ];
    for (const et of entityTypesData) this.entityTypes.set(et.id, et);

    // 8. Meta Property Definitions
    const propDefsData: MetaPropertyDefinition[] = [
      // Book
      { id: 'pd_book_author', entity_type_id: 'meta_book', code: 'author', label: 'Author(s)', data_type: 'string', is_required: true, sort_order: 1 },
      { id: 'pd_book_isbn', entity_type_id: 'meta_book', code: 'isbn', label: 'ISBN-13', data_type: 'string', is_required: false, sort_order: 2 },
      { id: 'pd_book_pages', entity_type_id: 'meta_book', code: 'pages', label: 'Page Count', data_type: 'number', is_required: false, sort_order: 3 },
      { id: 'pd_book_status', entity_type_id: 'meta_book', code: 'reading_status', label: 'Reading Status', data_type: 'select', is_required: true, sort_order: 4, enum_values: ['Want to Read', 'Reading', 'Finished', 'Abandoned'] },
      { id: 'pd_book_rating', entity_type_id: 'meta_book', code: 'rating', label: 'Rating (1-5)', data_type: 'number', is_required: false, sort_order: 5 },
      { id: 'pd_book_publisher', entity_type_id: 'meta_book', code: 'publisher', label: 'Publisher', data_type: 'string', is_required: false, sort_order: 6 },

      // Ammo
      { id: 'pd_ammo_caliber', entity_type_id: 'meta_ammo', code: 'caliber', label: 'Caliber / Gauge', data_type: 'select', is_required: true, sort_order: 1, enum_values: ['9x19mm Parabellum', '.45 ACP', '5.56x45mm NATO', '.308 Winchester', '12 Gauge', '.22 LR'] },
      { id: 'pd_ammo_grain', entity_type_id: 'meta_ammo', code: 'bullet_grain', label: 'Bullet Weight (gr)', data_type: 'number', is_required: true, sort_order: 2 },
      { id: 'pd_ammo_type', entity_type_id: 'meta_ammo', code: 'bullet_type', label: 'Bullet Type', data_type: 'select', is_required: true, sort_order: 3, enum_values: ['FMJ', 'JHP', 'SP', 'BTHP', 'Frangible', 'Birdshot', 'Slug'] },
      { id: 'pd_ammo_manufacturer', entity_type_id: 'meta_ammo', code: 'manufacturer', label: 'Manufacturer / Brand', data_type: 'string', is_required: true, sort_order: 4 },
      { id: 'pd_ammo_qty', entity_type_id: 'meta_ammo', code: 'inventory_qty', label: 'Inventory Quantity (rounds)', data_type: 'number', is_required: true, sort_order: 5 },
      { id: 'pd_ammo_velocity', entity_type_id: 'meta_ammo', code: 'muzzle_velocity_fps', label: 'Muzzle Velocity (fps)', data_type: 'number', is_required: false, sort_order: 6 },
      { id: 'pd_ammo_lot', entity_type_id: 'meta_ammo', code: 'lot_number', label: 'Lot Number', data_type: 'string', is_required: false, sort_order: 7 },

      // Software
      { id: 'pd_soft_lang', entity_type_id: 'meta_software', code: 'language', label: 'Primary Language / Stack', data_type: 'string', is_required: true, sort_order: 1 },
      { id: 'pd_soft_repo', entity_type_id: 'meta_software', code: 'repo_url', label: 'Repository URL', data_type: 'string', is_required: false, sort_order: 2 },
      { id: 'pd_soft_license', entity_type_id: 'meta_software', code: 'license', label: 'License', data_type: 'select', is_required: true, sort_order: 3, enum_values: ['MIT', 'Apache-2.0', 'GPLv3', 'BSD-3-Clause', 'Proprietary'] },
      { id: 'pd_soft_deploy', entity_type_id: 'meta_software', code: 'deployment', label: 'Deployment Target', data_type: 'select', is_required: false, sort_order: 4, enum_values: ['Docker / Docker Compose', 'Bare Metal (systemd)', 'Kubernetes', 'Serverless', 'Electron'] },
      { id: 'pd_soft_version', entity_type_id: 'meta_software', code: 'version', label: 'Latest Stable Version', data_type: 'string', is_required: false, sort_order: 5 },

      // Recipe
      { id: 'pd_rec_cuisine', entity_type_id: 'meta_recipe', code: 'cuisine', label: 'Cuisine Origin', data_type: 'string', is_required: true, sort_order: 1 },
      { id: 'pd_rec_prep_time', entity_type_id: 'meta_recipe', code: 'prep_time_minutes', label: 'Prep Time (minutes)', data_type: 'number', is_required: true, sort_order: 2 },
      { id: 'pd_rec_cook_time', entity_type_id: 'meta_recipe', code: 'cook_time_minutes', label: 'Cook Time (minutes)', data_type: 'number', is_required: true, sort_order: 3 },
      { id: 'pd_rec_servings', entity_type_id: 'meta_recipe', code: 'servings', label: 'Servings', data_type: 'number', is_required: true, sort_order: 4 },
      { id: 'pd_rec_difficulty', entity_type_id: 'meta_recipe', code: 'difficulty', label: 'Difficulty', data_type: 'select', is_required: true, sort_order: 5, enum_values: ['Easy', 'Medium', 'Advanced', 'MasterChef'] },
      { id: 'pd_rec_ingredients', entity_type_id: 'meta_recipe', code: 'ingredients_summary', label: 'Key Ingredients', data_type: 'textarea', is_required: true, sort_order: 6 },
    ];
    for (const pd of propDefsData) this.propertyDefinitions.set(pd.id, pd);

    // 9. Seed Domain Entities: People
    const peopleData: (PeoplePerson & { tags: string[] })[] = [
      {
        id: 'person_matteo',
        first_name: 'Matteo',
        last_name: 'Alessandrini',
        nickname: 'Teo',
        birthdate: '1995-04-12',
        bio: 'Software engineer, self-host enthusiast & architect of LifeHub modular infrastructure.',
        avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        gender: 'Male',
        company: 'DevOps & Distributed Systems Lab',
        role_title: 'Lead Systems Architect',
        notes: 'Enjoys Linux kernel tuning, low-power ARM servers (Raspberry Pi 4), and archery.',
        tags: ['tag_personal', 'tag_tech'],
      },
      {
        id: 'person_elena',
        first_name: 'Elena',
        last_name: 'Rinaldi',
        nickname: 'Ele',
        birthdate: '1997-08-23',
        bio: 'Geographic information systems (GIS) specialist and cartography researcher.',
        avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
        gender: 'Female',
        company: 'GeoSpatial Analytics Europe',
        role_title: 'Senior GIS Engineer',
        notes: 'Co-collaborator on PostGIS spatial indexing benchmarks and map tile servers.',
        tags: ['tag_work', 'tag_tech'],
      },
      {
        id: 'person_marcus',
        first_name: 'Marcus',
        last_name: 'Vance',
        nickname: 'Marc',
        birthdate: '1990-11-05',
        bio: 'Embedded hardware designer, ballistic telemetry specialist and electronics engineer.',
        avatar_url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
        gender: 'Male',
        company: 'Precision Hardware Labs',
        role_title: 'Hardware Engineer',
        notes: 'Supplied the high-precision chronograph sensor specs.',
        tags: ['tag_hardware', 'tag_tech'],
      },
    ];

    for (const p of peopleData) {
      this.registerEntity(p.id, 'person', `${p.first_name} ${p.last_name}`);
      this.people.set(p.id, {
        id: p.id,
        first_name: p.first_name,
        last_name: p.last_name,
        nickname: p.nickname,
        birthdate: p.birthdate,
        bio: p.bio,
        avatar_url: p.avatar_url,
        gender: p.gender,
        company: p.company,
        role_title: p.role_title,
        notes: p.notes,
      });
      for (const t of p.tags) this.addEntityTag(p.id, t);
    }

    // Contacts
    this.contacts.set('ct_1', { id: 'ct_1', person_id: 'person_matteo', type: 'email', value: 'al3ssandrini.m4tteo@gmail.com', label: 'Personal Email', is_primary: true });
    this.contacts.set('ct_2', { id: 'ct_2', person_id: 'person_matteo', type: 'telegram', value: '@matteo_arch', label: 'Telegram Direct', is_primary: false });
    this.contacts.set('ct_3', { id: 'ct_3', person_id: 'person_matteo', type: 'github', value: 'https://github.com/matteoa', label: 'GitHub Profile', is_primary: false });
    this.contacts.set('ct_4', { id: 'ct_4', person_id: 'person_elena', type: 'email', value: 'elena.rinaldi@geospatial.org', label: 'Work Email', is_primary: true });
    this.contacts.set('ct_5', { id: 'ct_5', person_id: 'person_marcus', type: 'phone', value: '+39 340 555 0192', label: 'Mobile', is_primary: true });

    // Relationships
    this.relationships.push(
      { id: 'rel_1', person_a_id: 'person_matteo', person_b_id: 'person_elena', relationship_type: 'Colleague', notes: 'Collaborating on spatial algorithms and Leaflet maps integration' },
      { id: 'rel_2', person_a_id: 'person_matteo', person_b_id: 'person_marcus', relationship_type: 'Hardware Partner', notes: 'Raspberry Pi server enclosures & chronograph hardware' }
    );

    // 10. Seed Domain Entities: Places (Using PostGIS-like geography points 4326)
    const placesData: (PlacesPlace & { tags: string[] })[] = [
      {
        id: 'place_home_lab',
        name: 'Home Office & Pi Cluster Lab',
        category: 'Work',
        address: 'Via delle Magnolie 14, Bologna, Italy',
        latitude: 44.4949,
        longitude: 11.3426,
        altitude: 54,
        description: 'Primary location of the Raspberry Pi 4 (8GB) server, SATA III SSD RAID, and local networking rack.',
        opening_hours: '24/7 Home Lab',
        tags: ['tag_personal', 'tag_tech'],
      },
      {
        id: 'place_colosseum',
        name: 'Colosseum Archeological Park',
        category: 'Cultural',
        address: 'Piazza del Colosseo 1, Roma, Italy',
        latitude: 41.8902,
        longitude: 12.4922,
        altitude: 20,
        description: 'Historic Roman amphitheatre and reference monument for geographical routing benchmarks.',
        website: 'https://parcocolosseo.it',
        tags: ['tag_travel'],
      },
      {
        id: 'place_berlin_hub',
        name: 'Berlin Open Source Campus',
        category: 'Facility',
        address: 'Alexanderplatz 7, Berlin, Germany',
        latitude: 52.5219,
        longitude: 13.4132,
        altitude: 34,
        description: 'Annual European self-hosting and Linux infrastructure conference venue.',
        tags: ['tag_work', 'tag_tech'],
      },
      {
        id: 'place_ramen_lab',
        name: 'Tokyo Craft Ramen Workshop',
        category: 'Restaurant',
        address: 'Shibuya City, Tokyo, Japan',
        latitude: 35.6580,
        longitude: 139.7016,
        altitude: 18,
        description: 'Specialist culinary laboratory for authentic slow-simmered Tonkotsu & Shoyu broth.',
        tags: ['tag_culinary', 'tag_travel'],
      },
    ];

    for (const pl of placesData) {
      this.registerEntity(pl.id, 'place', pl.name);
      this.places.set(pl.id, {
        id: pl.id,
        name: pl.name,
        category: pl.category,
        address: pl.address,
        latitude: pl.latitude,
        longitude: pl.longitude,
        altitude: pl.altitude,
        description: pl.description,
        opening_hours: pl.opening_hours,
        website: pl.website,
      });
      for (const t of pl.tags) this.addEntityTag(pl.id, t);
    }

    // Place visits
    this.visits.push({
      id: 'visit_1',
      place_id: 'place_home_lab',
      visited_at: '2026-08-10T14:30:00Z',
      rating: 5,
      notes: 'Installed the new Aluminum passive cooling case and updated kernel memory swap limits.',
    });
    this.visits.push({
      id: 'visit_2',
      place_id: 'place_colosseum',
      visited_at: '2026-05-18T10:00:00Z',
      rating: 5,
      notes: 'GPS accuracy test with PostGIS point indexing. Error margin was under 2.4 meters.',
    });

    // 11. Seed Domain Entities: Events
    const eventsData = [
      {
        id: 'event_lifehub_launch',
        title: 'LifeHub Architecture Review & Phase 1 Validation',
        description: 'Verification of Core, Meta Layer, Shared Services, and Extension System decoupling on Raspberry Pi 4 container.',
        start_time: '2026-08-16T10:00:00Z',
        end_time: '2026-08-16T12:00:00Z',
        is_all_day: false,
        place_id: 'place_home_lab',
        status: 'completed' as const,
        participants: [
          { person_id: 'person_matteo', role: 'organizer' as const, status: 'confirmed' as const },
          { person_id: 'person_elena', role: 'attendee' as const, status: 'confirmed' as const },
        ],
        tags: ['tag_tech', 'tag_urgent'],
      },
      {
        id: 'event_gis_summit',
        title: 'PostGIS & OpenStreetMap Modern Spatial Workshop',
        description: 'Deep dive into geography(Point, 4326) and spatial GIST indexing on ARM64 nodes.',
        start_time: '2026-09-05T09:00:00Z',
        end_time: '2026-09-06T18:00:00Z',
        is_all_day: true,
        place_id: 'place_berlin_hub',
        status: 'planned' as const,
        participants: [
          { person_id: 'person_elena', role: 'speaker' as const, status: 'confirmed' as const },
          { person_id: 'person_matteo', role: 'attendee' as const, status: 'confirmed' as const },
        ],
        tags: ['tag_work', 'tag_travel'],
      },
      {
        id: 'event_culinary_evening',
        title: 'Traditional Carbonara Masterclass',
        description: 'Authentic Roman pasta preparation with guanciale and Pecorino Romano.',
        start_time: '2026-08-20T19:30:00Z',
        end_time: '2026-08-20T22:00:00Z',
        is_all_day: false,
        place_id: 'place_home_lab',
        status: 'planned' as const,
        participants: [
          { person_id: 'person_matteo', role: 'organizer' as const, status: 'confirmed' as const },
          { person_id: 'person_marcus', role: 'guest' as const, status: 'confirmed' as const },
        ],
        tags: ['tag_culinary', 'tag_personal'],
      },
    ];

    for (const ev of eventsData) {
      this.registerEntity(ev.id, 'event', ev.title);
      this.events.set(ev.id, {
        id: ev.id,
        title: ev.title,
        description: ev.description,
        start_time: ev.start_time,
        end_time: ev.end_time,
        is_all_day: ev.is_all_day,
        place_id: ev.place_id,
        status: ev.status,
      });
      for (const t of ev.tags) this.addEntityTag(ev.id, t);
      for (const p of ev.participants) {
        this.participants.push({
          id: 'part_' + Math.random().toString(36).substring(2, 9),
          event_id: ev.id,
          person_id: p.person_id,
          role: p.role,
          status: p.status,
        });
      }
    }

    // 12. Seed Domain Entities: Knowledge Items (Demonstrating Meta Layer JSONB)
    const knowledgeData = [
      {
        id: 'know_clean_arch',
        entity_type_id: 'meta_book',
        title: 'Clean Architecture: A Craftsman\'s Guide to Software Structure',
        description: 'Foundational guide to universal software boundaries, dependency inversion, and decoupled domains.',
        notes: 'Key takeaway: Core must never depend on volatile frameworks, UI, or optional database extensions.',
        properties: {
          author: 'Robert C. Martin (Uncle Bob)',
          isbn: '978-0134494166',
          pages: 432,
          reading_status: 'Finished',
          rating: 5,
          publisher: 'Prentice Hall',
        },
        tags: ['tag_tech', 'tag_work'],
      },
      {
        id: 'know_ammo_9mm',
        entity_type_id: 'meta_ammo',
        title: 'Fiocchi 9mm Luger FMJ 124gr Target Grade',
        description: 'Precision Italian manufacture full metal jacket training cartridge with clean-burning powder.',
        notes: 'Reliable cycling in semi-automatic platforms, consistent muzzle energy across 50-round string.',
        properties: {
          caliber: '9x19mm Parabellum',
          bullet_grain: 124,
          bullet_type: 'FMJ',
          manufacturer: 'Fiocchi Munizioni',
          inventory_qty: 1500,
          muzzle_velocity_fps: 1180,
          lot_number: 'FI-2026-B89',
        },
        tags: ['tag_hardware', 'tag_personal'],
      },
      {
        id: 'know_fastapi',
        entity_type_id: 'meta_software',
        title: 'FastAPI High-Performance Python Web Framework',
        description: 'Modern, fast (high-performance), web framework for building APIs with Python 3.8+ based on standard Python type hints.',
        notes: 'Powers the LifeHub REST API microservices with automatic OpenAPI schemas and Pydantic validation.',
        properties: {
          language: 'Python 3.12 / Pydantic v2',
          repo_url: 'https://github.com/tiangolo/fastapi',
          license: 'MIT',
          deployment: 'Docker / Docker Compose',
          version: '0.115.0',
        },
        tags: ['tag_tech'],
      },
      {
        id: 'know_recipe_carbonara',
        entity_type_id: 'meta_recipe',
        title: 'Authentic Roman Spaghetti alla Carbonara',
        description: 'Strict traditional recipe: no cream, no peas, no garlic. Only guanciale, pecorino, egg yolks and freshly cracked black pepper.',
        notes: 'Use pasta cooking water to emulsify the pecorino and egg cream without scrambling.',
        properties: {
          cuisine: 'Roman / Italian',
          prep_time_minutes: 10,
          cook_time_minutes: 15,
          servings: 4,
          difficulty: 'Medium',
          ingredients_summary: '400g Spaghetti (bronze cut), 200g Guanciale di Amatrice, 4 egg yolks + 1 whole egg, 100g Pecorino Romano DOP, tellicherry black pepper.',
        },
        tags: ['tag_culinary', 'tag_personal'],
      },
    ];

    for (const kn of knowledgeData) {
      this.registerEntity(kn.id, 'knowledge_item', kn.title);
      this.knowledgeItems.set(kn.id, {
        id: kn.id,
        entity_type_id: kn.entity_type_id,
        title: kn.title,
        description: kn.description,
        notes: kn.notes,
        properties: kn.properties,
      });
      for (const t of kn.tags) this.addEntityTag(kn.id, t);
    }

    // 13. Seed Domain Entities: Buildings (Validation of Reusability / Phase 12)
    const building: BuildingsBuilding = {
      id: 'bld_server_facility',
      name: 'LifeHub Primary Server Hub & Workshop',
      code: 'HUB-B14',
      building_type: 'Server Room',
      address: 'Via delle Magnolie 14, Bologna',
      place_id: 'place_home_lab',
      manager_person_id: 'person_matteo',
      floors_count: 2,
      total_area_sqm: 140,
      notes: 'Dedicated solar-backed 24V UPS power supply for continuous 365-day operation.',
    };
    this.registerEntity(building.id, 'building', building.name);
    this.buildings.set(building.id, building);
    this.addEntityTag(building.id, 'tag_hardware');

    // 14. Universal Cross-Entity Links
    this.addLink('person_matteo', 'know_clean_arch', 'lt_related_to', 'Architectural reference for LifeHub Core design');
    this.addLink('person_matteo', 'place_home_lab', 'lt_works_at', 'Primary workspace and lab');
    this.addLink('event_lifehub_launch', 'place_home_lab', 'lt_located_at', 'Hosted in the primary lab');
    this.addLink('bld_server_facility', 'person_matteo', 'lt_manages', 'Managed by lead architect');

    // 15. Audit Log Seed
    this.logAudit('user_admin', 'CONFIG_CHANGE', 'LifeHub instance initialized with Core, Meta, and Shared layers active.');
    this.logAudit('user_matteo', 'CREATE', 'Created Person record: Matteo Alessandrini', 'person_matteo', 'person');
    this.logAudit('user_matteo', 'CREATE', 'Created Place record: Home Office & Pi Cluster Lab', 'place_home_lab', 'place');
    this.logAudit('user_matteo', 'CREATE', 'Created Knowledge item: Clean Architecture', 'know_clean_arch', 'knowledge_item');
  }

  // Backup & Restore
  exportDatabaseBackup() {
    return {
      version: '1.0.0',
      exported_at: new Date().toISOString(),
      instance_config: this.instanceConfig,
      core: {
        users: Array.from(this.users.values()),
        roles: Array.from(this.roles.values()),
        entities: Array.from(this.entities.values()),
        modules: Array.from(this.modules.values()),
        audit_log: this.auditLog,
      },
      meta: {
        entity_types: Array.from(this.entityTypes.values()),
        property_definitions: Array.from(this.propertyDefinitions.values()),
        property_groups: Array.from(this.propertyGroups.values()),
      },
      shared: {
        tags: Array.from(this.tags.values()),
        entity_tags: this.entityTags,
        link_types: Array.from(this.linkTypes.values()),
        links: this.links,
      },
      domain: {
        people: Array.from(this.people.values()),
        contacts: Array.from(this.contacts.values()),
        relationships: this.relationships,
        places: Array.from(this.places.values()),
        visits: this.visits,
        events: Array.from(this.events.values()),
        participants: this.participants,
        knowledge_items: Array.from(this.knowledgeItems.values()),
        buildings: Array.from(this.buildings.values()),
      },
      extensions: Array.from(this.extensions.values()),
    };
  }

  importDatabaseBackup(backup: any) {
    if (!backup || !backup.core || !backup.domain) {
      throw new Error('Invalid backup schema');
    }
    if (backup.instance_config) this.instanceConfig = backup.instance_config;
    if (backup.core.users) {
      this.users.clear();
      for (const u of backup.core.users) this.users.set(u.id, u);
    }
    if (backup.core.entities) {
      this.entities.clear();
      for (const e of backup.core.entities) this.entities.set(e.id, e);
    }
    if (backup.domain.people) {
      this.people.clear();
      for (const p of backup.domain.people) this.people.set(p.id, p);
    }
    if (backup.domain.places) {
      this.places.clear();
      for (const pl of backup.domain.places) this.places.set(pl.id, pl);
    }
    if (backup.domain.events) {
      this.events.clear();
      for (const ev of backup.domain.events) this.events.set(ev.id, ev);
    }
    if (backup.domain.knowledge_items) {
      this.knowledgeItems.clear();
      for (const kn of backup.domain.knowledge_items) this.knowledgeItems.set(kn.id, kn);
    }
    this.logAudit('user_admin', 'CONFIG_CHANGE', 'Restored database snapshot from uploaded backup.');
    return { success: true, timestamp: new Date().toISOString() };
  }
}

// Global Singleton Database Instance
export const db = new LifeHubDatabase();
