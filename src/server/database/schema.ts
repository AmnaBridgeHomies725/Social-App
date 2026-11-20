import {
  pgTable,
  serial,
  integer,
  text,
  unique,
  index,
} from "drizzle-orm/pg-core";

import { sql, relations } from "drizzle-orm";
import { user, session, account } from "./auth-schema";


export const posts = pgTable(
  "posts",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .references(() => user.id, { onDelete: "cascade" }),
    text: text("text").notNull().default(""),
    imageUrl: text("image_url"),
    createdAt: text("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP::text`),
  },
  (table) => [
    index("idx_posts_created").on(table.createdAt, table.id),
  ],
);


export const likes = pgTable(
  "likes",
  {
    id: serial("id").primaryKey(),
    postId: integer("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [
    unique("likes_post_user_unique").on(table.postId, table.userId),
  ],
);


export const comments = pgTable(
  "comments",
  {
    id: serial("id").primaryKey(),
    postId: integer("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .references(() => user.id, { onDelete: "cascade" }),
    comment: text("comment").notNull(),
    createdAt: text("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP::text`),
  },
  (table) => [
    index("idx_comments_post").on(table.postId),
  ],
);

export const postsRelations = relations(posts, ({ one, many }) => ({
  user: one(user, { fields: [posts.userId], references: [user.id] }),
  comments: many(comments),
  likes: many(likes),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  post: one(posts, { fields: [comments.postId], references: [posts.id] }),
  user: one(user, { fields: [comments.userId], references: [user.id] }),
}));

export const likesRelations = relations(likes, ({ one }) => ({
  post: one(posts, { fields: [likes.postId], references: [posts.id] }),
  user: one(user, { fields: [likes.userId], references: [user.id] }),
}));

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  posts: many(posts),
  comments: many(comments),
  likes: many(likes),
}));

export * from "./auth-schema";
