CREATE TABLE "user_keywords" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"app_id" uuid NOT NULL,
	"user_id" uuid,
	"device_id" varchar(255) NOT NULL,
	"keyword" varchar(50) NOT NULL,
	"reply" varchar(500) NOT NULL,
	"match_type" varchar(20) DEFAULT 'exact',
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_phrases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"app_id" uuid NOT NULL,
	"user_id" uuid,
	"device_id" varchar(255) NOT NULL,
	"phrase" varchar(500) NOT NULL,
	"label" varchar(50),
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_keywords" ADD CONSTRAINT "user_keywords_app_id_apps_id_fk" FOREIGN KEY ("app_id") REFERENCES "public"."apps"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_keywords" ADD CONSTRAINT "user_keywords_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_phrases" ADD CONSTRAINT "user_phrases_app_id_apps_id_fk" FOREIGN KEY ("app_id") REFERENCES "public"."apps"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_phrases" ADD CONSTRAINT "user_phrases_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "keywords_app_device_idx" ON "user_keywords" USING btree ("app_id","device_id");--> statement-breakpoint
CREATE INDEX "keywords_keyword_idx" ON "user_keywords" USING btree ("keyword");--> statement-breakpoint
CREATE INDEX "phrases_app_device_idx" ON "user_phrases" USING btree ("app_id","device_id");