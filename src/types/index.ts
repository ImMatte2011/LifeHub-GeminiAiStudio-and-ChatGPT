export interface User {
  id: string;
  username: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  role_id: string;
  is_active: boolean;
  created_at: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  is_admin: boolean;
}

export interface ModuleInfo {
  id: string;
  name: string;
  description: string;
  icon: string;
  is_enabled: boolean;
  version: string;
  required_extensions: string[];
  extensions_ready?: boolean;
  missing_extensions?: string[];
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  icon?: string;
}

export interface LinkType {
  id: string;
  code: string;
  forward_label: string;
  reverse_label: string;
}

export interface EntityLink {
  id: string;
  source_entity_id: string;
  target_entity_id: string;
  link_type_id: string;
  notes?: string;
  created_at: string;
  direction?: 'incoming' | 'outgoing';
  target_entity?: { id: string; title: string; entity_type: string };
  link_type?: LinkType;
}

export interface Person {
  id: string;
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
  tags: Tag[];
  contacts_count?: number;
  primary_contact?: Contact;
  contacts?: Contact[];
  relationships?: any[];
  links?: any[];
  events?: any[];
}

export interface Contact {
  id: string;
  person_id: string;
  type: 'email' | 'phone' | 'telegram' | 'website' | 'address' | 'github' | 'linkedin';
  value: string;
  label: string;
  is_primary: boolean;
}

export interface Place {
  id: string;
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
  tags: Tag[];
  visits_count?: number;
  distance_km?: number;
  visits?: Visit[];
}

export interface Visit {
  id: string;
  place_id: string;
  visited_at: string;
  rating?: number;
  notes?: string;
  photos?: string[];
}

export interface EventItem {
  id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time?: string;
  is_all_day: boolean;
  place_id?: string;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  recurrence?: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  tags: Tag[];
  place?: Place;
  participants: Participant[];
  participants_count?: number;
}

export interface Participant {
  id: string;
  event_id: string;
  person_id: string;
  role: 'organizer' | 'attendee' | 'speaker' | 'guest';
  status: 'confirmed' | 'tentative' | 'declined';
  person?: Person;
}

export interface MetaType {
  id: string;
  code: string;
  name: string;
  icon: string;
  description: string;
  schema_version: number;
}

export interface PropertyDefinition {
  id: string;
  entity_type_id: string;
  code: string;
  label: string;
  data_type: 'string' | 'number' | 'boolean' | 'date' | 'select' | 'textarea' | 'tags';
  is_required: boolean;
  sort_order: number;
  enum_values?: string[];
  default_value?: any;
}

export interface Knowledge {
  id: string;
  entity_type_id: string;
  title: string;
  description?: string;
  notes?: string;
  properties: Record<string, any>;
  tags: Tag[];
  meta_type?: MetaType;
  property_definitions?: PropertyDefinition[];
  links?: any[];
}

export interface Building {
  id: string;
  name: string;
  code: string;
  building_type: string;
  address?: string;
  place_id?: string;
  manager_person_id?: string;
  floors_count: number;
  total_area_sqm: number;
  notes?: string;
  tags: Tag[];
  place?: Place;
  manager?: Person;
  maps_extension_ready?: boolean;
}

export interface TechnicalExtension {
  id: string;
  code: string;
  name: string;
  type: 'composite' | 'atomic';
  description: string;
  is_enabled: boolean;
  version: string;
  sub_components?: string[];
  parent_extension?: string;
  status: 'active' | 'disabled' | 'error';
}

export interface InstanceConfig {
  instance: {
    name: string;
    description: string;
    host_env?: string;
    version?: string;
  };
  modules: Record<string, boolean>;
  extensions: Record<string, boolean>;
  settings?: {
    multi_user_enabled?: boolean;
    default_role?: string;
    allow_registration?: boolean;
    storage_quota_mb?: number;
    language?: 'en' | 'it';
  };
}

export interface AuditLogItem {
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

export interface SearchResult {
  id: string;
  module: 'people' | 'places' | 'events' | 'knowledge' | 'buildings';
  entity_type: string;
  title: string;
  subtitle?: string;
  preview: string;
  tags: { id: string; name: string; color: string }[];
  score: number;
  match_type: 'exact' | 'prefix' | 'trigram_fuzzy' | 'tag_match' | 'fts';
  metadata?: Record<string, any>;
}

export interface GraphNode {
  id: string;
  title: string;
  module_name: string;
  entity_type: string;
  tags: Tag[];
  metaSnippet?: string;
  connections_count: number;
  created_at: string;
  // Simulation layout coordinates (client-side)
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  link_type_id: string;
  label: string;
  notes?: string;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  link_types: LinkType[];
  tags: Tag[];
  total_nodes: number;
  total_edges: number;
}

export interface TimelineItem {
  id: string;
  entity_id: string;
  module_name: string;
  type: 'event' | 'visit' | 'knowledge' | 'person' | 'building';
  title: string;
  subtitle?: string;
  timestamp: string;
  tags: Tag[];
  meta?: Record<string, any>;
}

export interface DatabaseInfo {
  id: string;
  name: string;
  description: string;
  category: 'primary' | 'finance' | 'research' | 'iot' | 'custom';
  created_at: string;
  is_active: boolean;
  size_mb: number;
  total_schemas: number;
  total_tables: number;
  total_records: number;
}

export interface ColumnDefinition {
  name: string;
  type: string;
  is_pk: boolean;
  is_fk: boolean;
  fk_target?: string;
  is_nullable: boolean;
  default_value?: string;
  description?: string;
  indexes?: string[];
}

export interface ForeignKeyRelation {
  column: string;
  target_schema: string;
  target_table: string;
  target_column: string;
  constraint_name: string;
}

export interface TableDefinition {
  name: string;
  schema_name: string;
  display_name: string;
  description: string;
  row_count: number;
  columns: ColumnDefinition[];
  foreign_keys: ForeignKeyRelation[];
  ddl: string;
}

export interface SchemaDefinition {
  name: string;
  display_name: string;
  category: 'core' | 'meta' | 'shared' | 'domain' | 'custom';
  description: string;
  color: string;
  icon: string;
  total_tables: number;
  total_rows: number;
  tables: TableDefinition[];
}

export interface SchemaComparisonResult {
  left: {
    database_id: string;
    schema: SchemaDefinition;
  };
  right: {
    database_id: string;
    schema: SchemaDefinition;
  };
  comparison: {
    tables_count_diff: number;
    rows_count_diff: number;
    cross_relations_A_to_B: ForeignKeyRelation[];
    cross_relations_B_to_A: ForeignKeyRelation[];
    shared_entity_roots: string[];
  };
}


