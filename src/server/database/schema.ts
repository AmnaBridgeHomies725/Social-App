import {
  pgTable,
  serial,
  integer,
  text,
  unique,
  index,
} from "drizzle-orm/pg-core";

import { sql } from "drizzle-orm";
// Legacy users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name"),
  email: text("email").unique(),
  passwordHash: text("password_hash"),
  createdAt: text("created_at"),
});

// Posts table
export const posts = pgTable(
  "posts",
  {
    id: serial("id").primaryKey(),
    author: text("author").notNull(),
    text: text("text").notNull().default(""),
    imageUrl: text("image_url"),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    index("idx_posts_created").on(
      table.createdAt,
      table.id,
    ),
  ],
);

// Likes table
export const likes = pgTable(
  "likes",
  {
    id: serial("id").primaryKey(),
    postId: integer("post_id")
      .notNull()
      .references(() => posts.id, {
        onDelete: "cascade",
      }),
    userId: text("user_id").notNull(),
  },
  (table) => [
    unique("likes_post_user_unique").on(
      table.postId,
      table.userId,
    ),
  ],
);

// Comments table
export const comments = pgTable(
  "comments",
  {
    id: serial("id").primaryKey(),
    postId: integer("post_id")
      .notNull()
      .references(() => posts.id, {
        onDelete: "cascade",
      }),
    userId: text("user_id").notNull(),
    comment: text("comment").notNull(),
   createdAt: text("created_at")
  .notNull()
  .default(sql`CURRENT_TIMESTAMP::text`),
  },
  (table) => [
    index("idx_comments_post").on(table.postId),
  ],
);

export * from "./auth-schema";
