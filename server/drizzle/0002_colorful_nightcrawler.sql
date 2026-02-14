CREATE TYPE "public"."user_status" AS ENUM('active', 'disabled', 'suspended', 'pending_verification');--> statement-breakpoint
ALTER TABLE "apps" ALTER COLUMN "settings" SET DEFAULT '{"freeReplyLimitPerDay":10,"freeCandidateCount":1,"proCandidateCount":5,"enableAI":true,"enableSubscription":true,"aiProviders":[{"type":"mock","enabled":true,"priority":100}],"defaultAIProvider":"mock"}'::jsonb;--> statement-breakpoint
ALTER TABLE "usage_records" ADD COLUMN "token_count" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "usage_records" ADD COLUMN "ai_provider" varchar(50);--> statement-breakpoint
ALTER TABLE "usage_records" ADD COLUMN "model" varchar(100);--> statement-breakpoint
ALTER TABLE "usage_records" ADD COLUMN "success" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "usage_records" ADD COLUMN "duration_ms" integer;--> statement-breakpoint
ALTER TABLE "usage_records" ADD COLUMN "error_message" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "status" "user_status" DEFAULT 'active' NOT NULL;--> statement-breakpoint
CREATE INDEX "usage_user_date_idx" ON "usage_records" USING btree ("user_id","date");--> statement-breakpoint
CREATE INDEX "usage_ai_provider_date_idx" ON "usage_records" USING btree ("ai_provider","date");--> statement-breakpoint
CREATE INDEX "usage_model_date_idx" ON "usage_records" USING btree ("model","date");--> statement-breakpoint
CREATE INDEX "usage_success_date_idx" ON "usage_records" USING btree ("success","date");