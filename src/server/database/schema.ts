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

// Posts table
export const posts = pgTable(
  "posts",
  {
    id: serial("id").primaryKey(),
    author: text("author"),
    authorId: text("author_id"),
    text: text("text").notNull().default(""),
    imageUrl: text("image_url"),
    createdAt: text("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP::text`),
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
    userId: text("user_id"),
    authorId: text("author_id"),
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
  author: one(user, { fields: [posts.authorId], references: [user.id] }),
  comments: many(comments),
  likes: many(likes),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  post: one(posts, { fields: [comments.postId], references: [posts.id] }),
  author: one(user, { fields: [comments.authorId], references: [user.id] }),
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
