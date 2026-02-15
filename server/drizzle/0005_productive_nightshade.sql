ALTER TABLE "apps" ADD COLUMN "slug" varchar(100);--> statement-breakpoint
ALTER TABLE "apps" ADD CONSTRAINT "apps_slug_unique" UNIQUE("slug");