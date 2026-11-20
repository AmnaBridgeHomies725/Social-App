ALTER TABLE "users" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "users" CASCADE;--> statement-breakpoint
ALTER TABLE "comments" ALTER COLUMN "user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "posts" ALTER COLUMN "author" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "posts" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP::text;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_provider_unique" UNIQUE("provider_id","account_id");