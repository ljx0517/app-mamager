CREATE TYPE "public"."chatq_persona_package_gender" AS ENUM('male', 'female', 'any');--> statement-breakpoint
CREATE TYPE "public"."chatq_persona_tag_sentiment" AS ENUM('positive', 'neutral', 'negative');--> statement-breakpoint
CREATE TABLE "chatq_dimensions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dimension_id" varchar(50) NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"sort" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chatq_dimensions_dimension_id_unique" UNIQUE("dimension_id")
);
--> statement-breakpoint
CREATE TABLE "chatq_persona_packages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"package_id" varchar(50) NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"gender" "chatq_persona_package_gender" NOT NULL,
	"age_range" jsonb DEFAULT '[]'::jsonb,
	"tags" jsonb NOT NULL,
	"scenes" jsonb NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chatq_persona_packages_package_id_unique" UNIQUE("package_id")
);
--> statement-breakpoint
CREATE TABLE "chatq_persona_tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dimension_id" varchar(50) NOT NULL,
	"tag_id" varchar(50) NOT NULL,
	"name" varchar(100) NOT NULL,
	"sentiment" "chatq_persona_tag_sentiment" NOT NULL,
	"weight_default" real DEFAULT 0.5 NOT NULL,
	"description" text,
	"sort" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chatq_relations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"relation_id" varchar(50) NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"sort" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chatq_relations_relation_id_unique" UNIQUE("relation_id")
);
--> statement-breakpoint
CREATE TABLE "chatq_scenes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scene_id" varchar(50) NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"icon" varchar(10),
	"color" varchar(20),
	"sort" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chatq_scenes_scene_id_unique" UNIQUE("scene_id")
);
--> statement-breakpoint
ALTER TABLE "chatq_persona_tags" ADD CONSTRAINT "chatq_persona_tags_dimension_id_chatq_dimensions_dimension_id_fk" FOREIGN KEY ("dimension_id") REFERENCES "public"."chatq_dimensions"("dimension_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "chatq_persona_tags_dimension_tag" ON "chatq_persona_tags" USING btree ("dimension_id","tag_id");--> statement-breakpoint
CREATE INDEX "chatq_persona_tags_dimension_idx" ON "chatq_persona_tags" USING btree ("dimension_id");