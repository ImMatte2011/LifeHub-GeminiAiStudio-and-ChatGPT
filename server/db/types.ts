// LifeHub Database Types & Schemas

export interface CoreUser {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  full_name: string;
  avatar_url?: string;
  role_id: string; // admin, member, guest
  is_active: boolean;
  created_at: string;
  last_login?: string;
}

export interface CoreRole {
  id: string; // admin, member, guest
  name: string;
  description: string;
  is_admin: boolean;
}

export interface CoreRolePermission {
  id: string;
  role_id: string;
  permission_key: string; // e.g. "people.read", "people.write", "places.write", "admin.manage"
  allowed: boolean;
}

export interface CoreSession {
  id: string;
  user_id: string;
  token: string;
  created_at: string;
  expires_at: string;
  ip_address?: string;
  user_agent?: string;
}

export interface CoreSetting {
  key: string;
  value: any;
  description: string;
  updated_at: string;
}

export interface CoreEntity {
  id: string;
  entity_type: string; // e.g. 'person', 'place', 'event', 'knowledge_item', 'building'
  title: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface CoreModule {
  id: string; // 'people', 'places', 'events', 'knowledge', 'buildings'
  name: string;
  description: string;
  icon: string;
  is_enabled: boolean;
  version: string;
  required_extensions: string[]; // e.g. ['maps'] for places, ['maps'] for buildings
}

export interface CoreFeature {
  id: string;
  module_id: string;
  key: string;
  name: string;
  is_enabled: boolean;
}

export interface CoreModuleDependency {
  module_id: string;
  depends_on_module_id: string;
  is_required: boolean;
}

export interface CoreAuditLog {
  id: string;
  user_id: string;
  username: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'CONFIG_CHANGE' | 'EXTENSION_TOGGLE';
  entity_id?: string;
  entity_type?: string;
  details: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

// Meta Layer (Describes dynamic schemas without manual DDL)
export interface MetaEntityType {
  id: string; // 'book', 'ammo', 'software', 'recipe', 'custom'
  code: string;
  name: string;
  icon: string;
  description: string;
  schema_version: number;
}

export interface MetaPropertyDefinition {
  id: string;
  entity_type_id: string;
  code: string;
  label: string;
  data_type: 'string' | 'number' | 'boolean' | 'date' | 'select' | 'textarea' | 'tags';
  is_required: boolean;
  sort_order: number;
  enum_values?: string[];
  group_id?: string;
  default_value?: any;
}

export interface MetaPropertyGroup {
  id: string;
  entity_type_id: string;
  name: string;
  sort_order: number;
}

// Shared Services (Cross-cutting domain utilities)
export interface SharedTag {
  id: string;
  name: string;
  color: string;
  icon?: string;
}

export interface SharedEntityTag {
  id: string;
  entity_id: string;
  tag_id: string;
}

export interface SharedLinkType {
  id: string;
  code: string;
  forward_label: string;
  reverse_label: string;
}

export interface SharedLink {
  id: string;
  source_entity_id: string;
  target_entity_id: string;
  link_type_id: string;
  notes?: string;
  created_at: string;
}

export interface SharedFile {
  id: string;
  filename: string;
  file_size: number;
  mime_type: string;
  file_url: string;
  created_at: string;
}

export interface SharedEntityFile {
  id: string;
  entity_id: string;
  file_id: string;
  role: 'attachment' | 'cover' | 'avatar' | 'document';
}

// Domain: People
export interface PeoplePerson {
  id: string; // Foreign key -> CoreEntity.id
  first_name: string;
  last_name: string;
  nickname?: string;
  birthdate?: string;
  bio?: string;
  avatar_url?: string;
  gender?: string;
  company?: string;
  role_title?: string;
  notes?: string;
}

export interface PeopleContact {
  id: string;
  person_id: string;
  type: 'email' | 'phone' | 'telegram' | 'website' | 'address' | 'github' | 'linkedin';
  value: string;
  label: string;
  is_primary: boolean;
}

export interface PeopleRelationship {
  id: string;
  person_a_id: string;
  person_b_id: string;
  relationship_type: string; // 'Colleague', 'Friend', 'Family', 'Mentor', 'Partner'
  notes?: string;
}

// Domain: Places
export interface PlacesPlace {
  id: string; // Foreign key -> CoreEntity.id
  name: string;
  category: 'Home' | 'Work' | 'Travel' | 'Restaurant' | 'Outdoors' | 'Cultural' | 'Facility' | 'Other';
  address?: string;
  latitude: number;
  longitude: number;
  altitude?: number;
  description?: string;
  opening_hours?: string;
  website?: string;
  phone?: string;
}

export interface PlacesVisit {
  id: string;
  place_id: string;
  visited_at: string;
  rating?: number; // 1 to 5
  notes?: string;
  photos?: string[];
}

// Domain: Events
export interface EventsEvent {
  id: string; // Foreign key -> CoreEntity.id
  title: string;
  description?: string;
  start_time: string;
  end_time?: string;
  is_all_day: boolean;
  place_id?: string; // Optional reference to PlacesPlace.id
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  recurrence?: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
}

export interface EventsParticipant {
  id: string;
  event_id: string;
  person_id: string; // Reference to PeoplePerson.id
  role: 'organizer' | 'attendee' | 'speaker' | 'guest';
  status: 'confirmed' | 'tentative' | 'declined';
}

// Domain: Knowledge (JSONB Meta-driven)
export interface KnowledgeItem {
  id: string; // Foreign key -> CoreEntity.id
  entity_type_id: string; // Reference to MetaEntityType.id
  title: string;
  description?: string;
  notes?: string;
  properties: Record<string, any>; // JSONB schema validated against MetaPropertyDefinition
}

// Domain: Buildings (Demonstrates Phase 12 Reusability validation)
export interface BuildingsBuilding {
  id: string; // Foreign key -> CoreEntity.id
  name: string;
  code: string;
  building_type: 'Residential' | 'Commercial' | 'Industrial' | 'Server Room' | 'Workshop';
  address?: string;
  place_id?: string; // Optional geo-link to Places
  manager_person_id?: string; // Link to PeoplePerson
  floors_count: number;
  total_area_sqm: number;
  notes?: string;
}

// Extensions System
export interface TechnicalExtension {
  id: string;
  code: string; // 'maps', 'postgis', 'leaflet', 'osm', 'pg_trgm'
  name: string;
  type: 'composite' | 'atomic';
  description: string;
  is_enabled: boolean;
  version: string;
  sub_components?: string[]; // For composite e.g. maps -> postgis, leaflet, osm
  parent_extension?: string;
  status: 'active' | 'disabled' | 'error';
}

// Instance Configuration
export interface InstanceConfig {
  instance: {
    name: string;
    description: string;
    host_env?: string;
    version?: string;
  };
  modules: Record<string, boolean>; // e.g. { people: true, places: true, events: true, knowledge: true, buildings: false }
  extensions: Record<string, boolean>; // e.g. { maps: true, pg_trgm: true }
  settings?: {
    multi_user_enabled?: boolean;
    default_role?: string;
    allow_registration?: boolean;
    storage_quota_mb?: number;
    language?: 'en' | 'it';
  };
}
