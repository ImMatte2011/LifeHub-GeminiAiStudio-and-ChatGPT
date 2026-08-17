import {
  User,
  Role,
  ModuleInfo,
  Tag,
  LinkType,
  Person,
  Place,
  EventItem,
  Knowledge,
  Building,
  MetaType,
  PropertyDefinition,
  TechnicalExtension,
  InstanceConfig,
  AuditLogItem,
  SearchResult,
  Visit,
  DatabaseInfo,
  SchemaDefinition,
  SchemaComparisonResult,
} from '../types/index.js';

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(endpoint, {
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
    ...options,
  });

  if (!res.ok) {
    let errorMsg = `HTTP Error ${res.status}`;
    try {
      const json = await res.json();
      errorMsg = json.error || json.message || errorMsg;
      if (json.validation_errors) {
        errorMsg += `\n- ${json.validation_errors.join('\n- ')}`;
      }
    } catch {
      // not json
    }
    throw new Error(errorMsg);
  }

  return res.json();
}

export const api = {
  // Auth & Core Users
  auth: {
    me: () => request<{
      user: User;
      role: Role;
      permissions: string[];
      multi_user_enabled: boolean;
      all_users: User[];
    }>('/api/core/auth/me'),
    switchUser: (userId: string) =>
      request<{ success: boolean; user: User }>('/api/core/auth/switch-user', {
        method: 'POST',
        body: JSON.stringify({ user_id: userId }),
      }),
    getUsers: () => request<User[]>('/api/core/auth/users'),
    createUser: (data: Partial<User> & { password?: string }) =>
      request<User>('/api/core/auth/users', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    updateUser: (id: string, data: Partial<User>) =>
      request<User>(`/api/core/auth/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    getRoles: () => request<Role[]>('/api/core/auth/roles'),
  },

  // Core & Configuration
  core: {
    getActiveModules: () =>
      request<{
        active_modules: ModuleInfo[];
        instance_name: string;
        instance_description: string;
      }>('/api/core/modules/active'),
    getAllModules: () => request<ModuleInfo[]>('/api/core/modules'),
    toggleModule: (id: string, enabled: boolean) =>
      request<ModuleInfo>(`/api/core/modules/${id}/toggle`, {
        method: 'POST',
        body: JSON.stringify({ enabled }),
      }),
    getConfig: () => request<InstanceConfig>('/api/core/config'),
    updateConfig: (config: Partial<InstanceConfig>) =>
      request<InstanceConfig>('/api/core/config', {
        method: 'PUT',
        body: JSON.stringify(config),
      }),
    getConfigYaml: async () => {
      const res = await fetch('/api/core/config/yaml');
      return res.text();
    },
    updateConfigYaml: (yamlString: string) =>
      request<InstanceConfig>('/api/core/config/yaml', {
        method: 'POST',
        headers: { 'Content-Type': 'text/yaml' },
        body: yamlString,
      }),
    getPresets: () => request<Record<string, { name: string; yaml: string }>>('/api/core/config/presets'),
    getAuditLog: (params?: { limit?: number; entity_type?: string; action?: string }) => {
      const query = new URLSearchParams(params as any).toString();
      return request<AuditLogItem[]>(`/api/core/audit${query ? '?' + query : ''}`);
    },
    getSystemMetrics: () => request<any>('/api/core/system/metrics'),
    exportBackupUrl: '/api/core/backup/export',
    importBackup: (backupData: any) =>
      request<{ success: boolean; timestamp: string }>('/api/core/backup/import', {
        method: 'POST',
        body: JSON.stringify(backupData),
      }),
  },

  // Extensions Manager
  extensions: {
    list: () => request<TechnicalExtension[]>('/api/extensions'),
    getDiagnostics: () => request<any[]>('/api/extensions/diagnostics'),
    toggle: (code: string, enabled: boolean) =>
      request<{ success: boolean; extension: TechnicalExtension; diagnostic: any[] }>(
        `/api/extensions/${code}/toggle`,
        {
          method: 'POST',
          body: JSON.stringify({ enabled }),
        }
      ),
  },

  // Shared Services
  shared: {
    getTags: () => request<Tag[]>('/api/shared/tags'),
    createTag: (tag: Partial<Tag>) =>
      request<Tag>('/api/shared/tags', {
        method: 'POST',
        body: JSON.stringify(tag),
      }),
    deleteTag: (id: string) =>
      request<{ success: boolean }>(`/api/shared/tags/${id}`, { method: 'DELETE' }),
    getEntityTags: (entityId: string) => request<Tag[]>(`/api/shared/entity-tags/${entityId}`),
    addEntityTag: (entityId: string, tagId: string) =>
      request<{ success: boolean; tags: Tag[] }>('/api/shared/entity-tags', {
        method: 'POST',
        body: JSON.stringify({ entity_id: entityId, tag_id: tagId }),
      }),
    removeEntityTag: (entityId: string, tagId: string) =>
      request<{ success: boolean; tags: Tag[] }>(`/api/shared/entity-tags/${entityId}/${tagId}`, {
        method: 'DELETE',
      }),
    getLinkTypes: () => request<LinkType[]>('/api/shared/link-types'),
    getEntityLinks: (entityId: string) => request<any[]>(`/api/shared/links/${entityId}`),
    createLink: (sourceId: string, targetId: string, linkTypeId: string, notes?: string) =>
      request<any>('/api/shared/links', {
        method: 'POST',
        body: JSON.stringify({
          source_entity_id: sourceId,
          target_entity_id: targetId,
          link_type_id: linkTypeId,
          notes,
        }),
      }),
    deleteLink: (linkId: string) =>
      request<{ success: boolean }>(`/api/shared/links/${linkId}`, { method: 'DELETE' }),
    getGraph: (params?: { module_name?: string; tag_id?: string; search?: string }) => {
      const query = new URLSearchParams(params as any).toString();
      return request<import('../types/index.js').GraphData>(
        `/api/shared/graph${query ? '?' + query : ''}`
      );
    },
    getTimeline: (params?: { limit?: number; module_name?: string }) => {
      const query = new URLSearchParams(params as any).toString();
      return request<import('../types/index.js').TimelineItem[]>(
        `/api/shared/timeline${query ? '?' + query : ''}`
      );
    },
  },

  // Meta Layer
  meta: {
    getEntityTypes: () => request<MetaType[]>('/api/meta/entity-types'),
    createEntityType: (data: Partial<MetaType>) =>
      request<MetaType>('/api/meta/entity-types', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getPropertyDefinitions: (entityTypeId?: string) =>
      request<PropertyDefinition[]>(
        `/api/meta/property-definitions${entityTypeId ? '?entity_type_id=' + entityTypeId : ''}`
      ),
    createPropertyDefinition: (data: Partial<PropertyDefinition>) =>
      request<PropertyDefinition>('/api/meta/property-definitions', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    deletePropertyDefinition: (id: string) =>
      request<{ success: boolean }>(`/api/meta/property-definitions/${id}`, { method: 'DELETE' }),
    getSchema: (typeId: string) =>
      request<{ type: MetaType; properties: PropertyDefinition[] }>(`/api/meta/schema/${typeId}`),
  },

  // People Module
  people: {
    list: () => request<Person[]>('/api/people'),
    get: (id: string) => request<Person>(`/api/people/${id}`),
    create: (person: any) =>
      request<Person>('/api/people', {
        method: 'POST',
        body: JSON.stringify(person),
      }),
    update: (id: string, person: any) =>
      request<Person>(`/api/people/${id}`, {
        method: 'PUT',
        body: JSON.stringify(person),
      }),
    delete: (id: string) =>
      request<{ success: boolean }>(`/api/people/${id}`, { method: 'DELETE' }),
    addContact: (personId: string, contact: any) =>
      request<any>(`/api/people/${personId}/contacts`, {
        method: 'POST',
        body: JSON.stringify(contact),
      }),
    deleteContact: (contactId: string) =>
      request<{ success: boolean }>(`/api/people/contacts/${contactId}`, { method: 'DELETE' }),
  },

  // Places Module
  places: {
    list: (params?: { user_lat?: number; user_lng?: number; category?: string; tag_id?: string }) => {
      const query = new URLSearchParams(params as any).toString();
      return request<{ places: Place[]; maps_extension_active: boolean }>(
        `/api/places${query ? '?' + query : ''}`
      );
    },
    get: (id: string) => request<Place>(`/api/places/${id}`),
    create: (place: any) =>
      request<Place>('/api/places', {
        method: 'POST',
        body: JSON.stringify(place),
      }),
    update: (id: string, place: any) =>
      request<Place>(`/api/places/${id}`, {
        method: 'PUT',
        body: JSON.stringify(place),
      }),
    delete: (id: string) =>
      request<{ success: boolean }>(`/api/places/${id}`, { method: 'DELETE' }),
    queryRadius: (lat: number, lng: number, radiusKm: number) =>
      request<{ center: { lat: number; lng: number }; radius_km: number; total_found: number; results: Place[] }>(
        `/api/places/query/radius?lat=${lat}&lng=${lng}&radius_km=${radiusKm}`
      ),
    addVisit: (placeId: string, visit: any) =>
      request<Visit>(`/api/places/${placeId}/visits`, {
        method: 'POST',
        body: JSON.stringify(visit),
      }),
  },

  // Events Module
  events: {
    list: (params?: { start_after?: string; end_before?: string; person_id?: string; place_id?: string; status?: string }) => {
      const query = new URLSearchParams(params as any).toString();
      return request<EventItem[]>(`/api/events${query ? '?' + query : ''}`);
    },
    get: (id: string) => request<EventItem>(`/api/events/${id}`),
    create: (event: any) =>
      request<EventItem>('/api/events', {
        method: 'POST',
        body: JSON.stringify(event),
      }),
    update: (id: string, event: any) =>
      request<EventItem>(`/api/events/${id}`, {
        method: 'PUT',
        body: JSON.stringify(event),
      }),
    delete: (id: string) =>
      request<{ success: boolean }>(`/api/events/${id}`, { method: 'DELETE' }),
    addParticipant: (eventId: string, personId: string, role?: string, status?: string) =>
      request<any>(`/api/events/${eventId}/participants`, {
        method: 'POST',
        body: JSON.stringify({ person_id: personId, role, status }),
      }),
  },

  // Knowledge Module
  knowledge: {
    list: (params?: { entity_type_id?: string; tag_id?: string }) => {
      const query = new URLSearchParams(params as any).toString();
      return request<Knowledge[]>(`/api/knowledge${query ? '?' + query : ''}`);
    },
    get: (id: string) => request<Knowledge>(`/api/knowledge/${id}`),
    create: (item: any) =>
      request<Knowledge>('/api/knowledge', {
        method: 'POST',
        body: JSON.stringify(item),
      }),
    update: (id: string, item: any) =>
      request<Knowledge>(`/api/knowledge/${id}`, {
        method: 'PUT',
        body: JSON.stringify(item),
      }),
    delete: (id: string) =>
      request<{ success: boolean }>(`/api/knowledge/${id}`, { method: 'DELETE' }),
  },

  // Buildings Module (Phase 12 Reusability Demo)
  buildings: {
    list: () => request<Building[]>('/api/buildings'),
    get: (id: string) => request<Building>(`/api/buildings/${id}`),
    create: (building: any) =>
      request<Building>('/api/buildings', {
        method: 'POST',
        body: JSON.stringify(building),
      }),
    delete: (id: string) =>
      request<{ success: boolean }>(`/api/buildings/${id}`, { method: 'DELETE' }),
  },

  // Search
  search: {
    query: (q: string, module?: string, tag?: string) => {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (module) params.set('module', module);
      if (tag) params.set('tag', tag);
      return request<{
        query: string;
        total: number;
        pg_trgm_enabled: boolean;
        results: SearchResult[];
      }>(`/api/search?${params.toString()}`);
    },
  },

  // Databases & Schema Inspector
  databases: {
    list: () =>
      request<{
        active_database_id: string;
        databases: DatabaseInfo[];
        engine?: 'cloud_sql' | 'local_sqlite' | 'local_file';
        database_config?: any;
        cloud_sql_info?: any;
        local_storage_info?: any;
      }>('/api/databases'),
    switchEngine: (data: {
      engine: 'cloud_sql' | 'local_sqlite' | 'local_file';
      file_path?: string;
      auto_sync?: boolean;
      active_instance?: string;
    }) =>
      request<{
        success: boolean;
        engine: string;
        database_config: any;
        active_database_id: string;
        message: string;
      }>('/api/databases/engine', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    switchActive: (id: string) =>
      request<{ success: boolean; active_database_id: string; databases: DatabaseInfo[] }>(
        '/api/databases/active',
        {
          method: 'POST',
          body: JSON.stringify({ id }),
        }
      ),
    create: (data: { id: string; name: string; description: string; category?: string }) =>
      request<DatabaseInfo>('/api/databases', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getSchemas: (dbId: string) =>
      request<{ database_id: string; total_schemas: number; schemas: SchemaDefinition[] }>(
        `/api/databases/${dbId}/schemas`
      ),
    getSchemaDetails: (dbId: string, schemaName: string) =>
      request<SchemaDefinition>(`/api/databases/${dbId}/schemas/${schemaName}`),
    getTableRecords: (
      dbId: string,
      schemaName: string,
      tableName: string,
      params?: { search?: string; page?: number; limit?: number }
    ) => {
      const sp = new URLSearchParams();
      if (params?.search) sp.set('search', params.search);
      if (params?.page) sp.set('page', params.page.toString());
      if (params?.limit) sp.set('limit', params.limit.toString());
      return request<{ total: number; page: number; limit: number; records: any[] }>(
        `/api/databases/${dbId}/schemas/${schemaName}/tables/${tableName}/records?${sp.toString()}`
      );
    },
    compareSchemas: (params: {
      dbA: string;
      schemaA: string;
      dbB: string;
      schemaB: string;
    }) => {
      const sp = new URLSearchParams({
        dbA: params.dbA,
        schemaA: params.schemaA,
        dbB: params.dbB,
        schemaB: params.schemaB,
      });
      return request<SchemaComparisonResult>(`/api/databases/compare?${sp.toString()}`);
    },
  },

  // Translation & Temporary Cache Service for User-Entered Data
  translate: {
    translateText: (text: string, targetLang: 'en' | 'it', sourceLang?: string) =>
      request<{
        success: boolean;
        original: string;
        translated: string;
        cached: boolean;
        targetLang: string;
      }>('/api/translate', {
        method: 'POST',
        body: JSON.stringify({ text, targetLang, sourceLang }),
      }),
    translateBatch: (texts: string[], targetLang: 'en' | 'it') =>
      request<{
        success: boolean;
        results: Array<{ original: string; translated: string; cached: boolean }>;
        targetLang: string;
      }>('/api/translate', {
        method: 'POST',
        body: JSON.stringify({ texts, targetLang }),
      }),
    getCacheStats: () =>
      request<{
        success: boolean;
        stats: { totalEntries: number; cacheFilePath: string; fileSizeBytes: number };
      }>('/api/translate/stats'),
    clearCache: () =>
      request<{ success: boolean; message: string }>('/api/translate/cache', {
        method: 'DELETE',
      }),
  },
};

