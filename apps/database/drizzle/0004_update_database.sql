ALTER TYPE "public"."pipeline_log_status" ADD VALUE 'needs_review';--> statement-breakpoint

CREATE TABLE "event_tag_embeddings" (
    "tag_name" "event_tag" PRIMARY KEY NOT NULL,
    "embedding" vector(1536) NOT NULL
);
--> statement-breakpoint

ALTER TABLE "event_tag_embeddings" ALTER COLUMN "tag_name" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "event_tags" ALTER COLUMN "tag" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "user_interests" ALTER COLUMN "tag" SET DATA TYPE text;--> statement-breakpoint

DROP TYPE "public"."event_tag";--> statement-breakpoint
CREATE TYPE "public"."event_tag" AS ENUM('free food', 'career', 'research', 'academics', 'tech', 'entrepreneurship', 'politics', 'visual arts', 'performing arts', 'literature', 'culture', 'music', 'gaming', 'athletics', 'religion', 'sustainability', 'outdoors', 'wellness', 'community service', 'speaker event', 'social event', 'stem');--> statement-breakpoint

-- event_tag_embeddings is a new table, so a direct cast is safe here
ALTER TABLE "event_tag_embeddings" ALTER COLUMN "tag_name" SET DATA TYPE "public"."event_tag" USING "tag_name"::"public"."event_tag";--> statement-breakpoint

-- Explicit mapping for event_tags
ALTER TABLE "event_tags" ALTER COLUMN "tag" SET DATA TYPE "public"."event_tag" USING (
  CASE "tag"
    WHEN 'free-food' THEN 'free food'
    WHEN 'workshop' THEN 'academics'
    WHEN 'performance' THEN 'performing arts'
    WHEN 'speaker' THEN 'speaker event'
    WHEN 'social' THEN 'social event'
    WHEN 'sports' THEN 'athletics'
    WHEN 'art' THEN 'visual arts'
    WHEN 'academic' THEN 'academics'
    WHEN 'cultural' THEN 'culture'
    WHEN 'community-service' THEN 'community service'
    WHEN 'religious' THEN 'religion'
    WHEN 'political' THEN 'politics'
    WHEN 'outdoor' THEN 'outdoors'
    ELSE "tag"
  END
)::"public"."event_tag";--> statement-breakpoint

-- Explicit mapping for user_interests
ALTER TABLE "user_interests" ALTER COLUMN "tag" SET DATA TYPE "public"."event_tag" USING (
  CASE "tag"
    WHEN 'free-food' THEN 'free food'
    WHEN 'workshop' THEN 'academics'
    WHEN 'performance' THEN 'performing arts'
    WHEN 'speaker' THEN 'speaker event'
    WHEN 'social' THEN 'social event'
    WHEN 'sports' THEN 'athletics'
    WHEN 'art' THEN 'visual arts'
    WHEN 'academic' THEN 'academics'
    WHEN 'cultural' THEN 'culture'
    WHEN 'community-service' THEN 'community service'
    WHEN 'religious' THEN 'religion'
    WHEN 'political' THEN 'politics'
    WHEN 'outdoor' THEN 'outdoors'
    ELSE "tag"
  END
)::"public"."event_tag";--> statement-breakpoint

ALTER TABLE "organizations" ALTER COLUMN "category" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."org_category";--> statement-breakpoint
CREATE TYPE "public"."org_category" AS ENUM('career', 'affinity', 'performing arts', 'academics', 'athletics', 'social event', 'culture', 'religion', 'politics', 'community service');--> statement-breakpoint

-- Explicit mapping for organizations
ALTER TABLE "organizations" ALTER COLUMN "category" SET DATA TYPE "public"."org_category" USING (
  CASE "category"
    WHEN 'academic' THEN 'academics'
    WHEN 'performance' THEN 'performing arts'
    WHEN 'cultural' THEN 'culture'
    WHEN 'athletic' THEN 'athletics'
    ELSE "category"
  END
)::"public"."org_category";