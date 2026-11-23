ALTER TABLE "posts" ADD COLUMN "user_id" text;
--> statement-breakpoint
UPDATE "posts" SET "user_id" = "author_id" WHERE "user_id" IS NULL AND "author_id" IS NOT NULL;
--> statement-breakpoint
DELETE FROM "comments" WHERE "user_id" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "user" WHERE "user"."id" = "comments"."user_id");
--> statement-breakpoint
DELETE FROM "likes" WHERE "user_id" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "user" WHERE "user"."id" = "likes"."user_id");
--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE "likes" ADD CONSTRAINT "likes_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE "posts" ALTER COLUMN "created_at" DROP DEFAULT;
--> statement-breakpoint
ALTER TABLE "posts" ALTER COLUMN "created_at" TYPE timestamptz USING "created_at"::timestamptz;
--> statement-breakpoint
ALTER TABLE "posts" ALTER COLUMN "created_at" SET DEFAULT now();
--> statement-breakpoint
ALTER TABLE "comments" ALTER COLUMN "created_at" DROP DEFAULT;
--> statement-breakpoint
ALTER TABLE "comments" ALTER COLUMN "created_at" TYPE timestamptz USING "created_at"::timestamptz;
--> statement-breakpoint
ALTER TABLE "comments" ALTER COLUMN "created_at" SET DEFAULT now();
--> statement-breakpoint
CREATE UNIQUE INDEX "profiles_username_lower_unique" ON "profiles" USING btree (lower("username"));
--> statement-breakpoint
CREATE TABLE "uploads" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"file_path" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uploads_file_path_unique" UNIQUE("file_path")
);
--> statement-breakpoint
ALTER TABLE "uploads" ADD CONSTRAINT "uploads_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "comments" DROP COLUMN "author_id";
--> statement-breakpoint
ALTER TABLE "posts" DROP COLUMN "author";
--> statement-breakpoint
ALTER TABLE "posts" DROP COLUMN "author_id";
