CREATE TABLE "audit_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"username" text NOT NULL,
	"action" text NOT NULL,
	"entity_id" text,
	"entity_type" text,
	"details" text NOT NULL,
	"metadata" jsonb,
	"timestamp" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "buildings" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"building_type" text DEFAULT 'Commercial' NOT NULL,
	"address" text,
	"place_id" text,
	"manager_person_id" text,
	"floors_count" integer DEFAULT 1 NOT NULL,
	"total_area_sqm" double precision DEFAULT 0 NOT NULL,
	"notes" text,
	"custom_properties" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "buildings_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "entities" (
	"id" text PRIMARY KEY NOT NULL,
	"entity_type" text NOT NULL,
	"title" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"created_by" text
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"start_time" text NOT NULL,
	"end_time" text,
	"is_all_day" boolean DEFAULT false NOT NULL,
	"place_id" text,
	"status" text DEFAULT 'planned' NOT NULL,
	"recurrence" text DEFAULT 'none' NOT NULL,
	"custom_properties" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "events_participants" (
	"id" text PRIMARY KEY NOT NULL,
	"event_id" text NOT NULL,
	"person_id" text NOT NULL,
	"role" text DEFAULT 'attendee' NOT NULL,
	"status" text DEFAULT 'confirmed' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "knowledge_items" (
	"id" text PRIMARY KEY NOT NULL,
	"entity_type_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"notes" text,
	"properties" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "meta_entity_types" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"icon" text NOT NULL,
	"description" text,
	"schema_version" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "meta_entity_types_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "meta_property_definitions" (
	"id" text PRIMARY KEY NOT NULL,
	"entity_type_id" text NOT NULL,
	"code" text NOT NULL,
	"label" text NOT NULL,
	"data_type" text NOT NULL,
	"is_required" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"enum_values" jsonb,
	"group_id" text,
	"default_value" jsonb
);
--> statement-breakpoint
CREATE TABLE "meta_property_groups" (
	"id" text PRIMARY KEY NOT NULL,
	"entity_type_id" text NOT NULL,
	"name" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "modules" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"icon" text NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"version" text DEFAULT '1.0.0' NOT NULL,
	"required_extensions" jsonb DEFAULT '[]'::jsonb
);
--> statement-breakpoint
CREATE TABLE "people" (
	"id" text PRIMARY KEY NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"nickname" text,
	"birthdate" text,
	"bio" text,
	"avatar_url" text,
	"gender" text,
	"company" text,
	"role_title" text,
	"notes" text,
	"custom_properties" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "people_contacts" (
	"id" text PRIMARY KEY NOT NULL,
	"person_id" text NOT NULL,
	"type" text NOT NULL,
	"value" text NOT NULL,
	"label" text NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "people_relationships" (
	"id" text PRIMARY KEY NOT NULL,
	"person_a_id" text NOT NULL,
	"person_b_id" text NOT NULL,
	"relationship_type" text NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "places" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"category" text DEFAULT 'Other' NOT NULL,
	"address" text,
	"latitude" double precision NOT NULL,
	"longitude" double precision NOT NULL,
	"altitude" double precision,
	"description" text,
	"opening_hours" text,
	"website" text,
	"phone" text,
	"notes" text,
	"custom_properties" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "places_visits" (
	"id" text PRIMARY KEY NOT NULL,
	"place_id" text NOT NULL,
	"visited_at" timestamp NOT NULL,
	"rating" integer,
	"notes" text,
	"photos" jsonb
);
--> statement-breakpoint
CREATE TABLE "role_permissions" (
	"id" text PRIMARY KEY NOT NULL,
	"role_id" text NOT NULL,
	"permission_key" text NOT NULL,
	"allowed" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"is_admin" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"expires_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"description" text,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "shared_entity_files" (
	"id" text PRIMARY KEY NOT NULL,
	"entity_id" text NOT NULL,
	"file_id" text NOT NULL,
	"role" text DEFAULT 'attachment' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shared_entity_tags" (
	"id" text PRIMARY KEY NOT NULL,
	"entity_id" text NOT NULL,
	"tag_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shared_files" (
	"id" text PRIMARY KEY NOT NULL,
	"filename" text NOT NULL,
	"file_size" integer NOT NULL,
	"mime_type" text NOT NULL,
	"file_url" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "shared_link_types" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"forward_label" text NOT NULL,
	"reverse_label" text NOT NULL,
	CONSTRAINT "shared_link_types_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "shared_links" (
	"id" text PRIMARY KEY NOT NULL,
	"source_entity_id" text NOT NULL,
	"target_entity_id" text NOT NULL,
	"link_type_id" text NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "shared_tags" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"color" text DEFAULT '#3b82f6' NOT NULL,
	"icon" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "shared_tags_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "technical_extensions" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"type" text DEFAULT 'atomic' NOT NULL,
	"description" text NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"version" text DEFAULT '1.0.0' NOT NULL,
	"sub_components" jsonb,
	"parent_extension" text,
	"status" text DEFAULT 'active' NOT NULL,
	CONSTRAINT "technical_extensions_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"full_name" text NOT NULL,
	"avatar_url" text,
	"role_id" text DEFAULT 'member' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"last_login" timestamp,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
