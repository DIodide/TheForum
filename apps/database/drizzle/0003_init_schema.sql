DROP TABLE "event_tag_embeddings" CASCADE;--> statement-breakpoint
ALTER TABLE "event_tags" ALTER COLUMN "tag" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "user_interests" ALTER COLUMN "tag" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."event_tag";--> statement-breakpoint
CREATE TYPE "public"."event_tag" AS ENUM('free-food', 'workshop', 'performance', 'speaker', 'social', 'career', 'sports', 'music', 'art', 'academic', 'cultural', 'community-service', 'religious', 'political', 'tech', 'gaming', 'outdoor', 'wellness');--> statement-breakpoint
ALTER TABLE "event_tags" ALTER COLUMN "tag" SET DATA TYPE "public"."event_tag" USING "tag"::"public"."event_tag";--> statement-breakpoint
ALTER TABLE "user_interests" ALTER COLUMN "tag" SET DATA TYPE "public"."event_tag" USING "tag"::"public"."event_tag";--> statement-breakpoint
ALTER TABLE "organizations" ALTER COLUMN "category" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."org_category";--> statement-breakpoint
CREATE TYPE "public"."org_category" AS ENUM('career', 'affinity', 'performance', 'academic', 'athletic', 'social', 'cultural', 'religious', 'political', 'service');--> statement-breakpoint
ALTER TABLE "organizations" ALTER COLUMN "category" SET DATA TYPE "public"."org_category" USING "category"::"public"."org_category";--> statement-breakpoint
ALTER TABLE "pipeline_logs" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."pipeline_log_status";--> statement-breakpoint
CREATE TYPE "public"."pipeline_log_status" AS ENUM('success', 'skipped_not_event', 'duplicate', 'error');--> statement-breakpoint
ALTER TABLE "pipeline_logs" ALTER COLUMN "status" SET DATA TYPE "public"."pipeline_log_status" USING "status"::"public"."pipeline_log_status";