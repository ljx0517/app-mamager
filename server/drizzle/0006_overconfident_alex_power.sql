CREATE TABLE "config_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_id" varchar(100) NOT NULL,
	"display_name" varchar(100) NOT NULL,
	"icon" varchar(10) DEFAULT '📦',
	"description" text,
	"component_path" varchar(255) NOT NULL,
	"default_config" jsonb,
	"is_builtin" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "config_templates_template_id_unique" UNIQUE("template_id")
);
