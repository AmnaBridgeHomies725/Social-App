CREATE TABLE "comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"post_id" integer NOT NULL,
	"user_id" text NOT NULL,
	"comment" text NOT NULL,
	"created_at" text DEFAULT CURRENT_TIMESTAMP::text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "likes" (
	"id" serial PRIMARY KEY NOT NULL,
	"post_id" integer NOT NULL,
	"user_id" text NOT NULL,
	CONSTRAINT "likes_post_user_unique" UNIQUE("post_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"author" text NOT NULL,
	"text" text DEFAULT '' NOT NULL,
	"image_url" text,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text,
	"email" text,
	"password_hash" text,
	"created_at" text,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "likes" ADD CONSTRAINT "likes_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_comments_post" ON "comments" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "idx_posts_created" ON "posts" USING btree ("created_at","id");