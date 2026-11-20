import {
  pgTable,
  uuid,
  text,
  timestamp,
  primaryKey,
  index,
  check,
} from "drizzle-orm/pg-core";

import { sql, relations } from "drizzle-orm";
import { user, session, account } from "./auth-schema";

// Posts table
export const posts = pgTable(
  "posts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    authorId: uuid("author_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    text: text("text").notNull(),
    imageUrl: text("image_url"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_posts_created").on(
      table.createdAt,
      table.id,
    ),
    index("idx_posts_author").on(table.authorId),
    check(
      "posts_text_length",
      sql`char_length(${table.text}) between 1 and 500`,
    ),
  ],
);

// Likes table
export const likes = pgTable(
  "likes",
  {
    postId: uuid("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.postId, table.userId] }),
    index("idx_likes_user").on(table.userId),
  ],
);

// Comments table
export const comments = pgTable(
  "comments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    postId: uuid("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    authorId: uuid("author_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    comment: text("comment").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_comments_post_created").on(
      table.postId,
      table.createdAt,
      table.id,
    ),
    index("idx_comments_author").on(table.authorId),
    check(
      "comments_length",
      sql`char_length(${table.comment}) between 1 and 300`,
    ),
  ],
);

export const profile = pgTable("profile", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),
  bio: text("bio"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

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

export const profileRelations = relations(profile, ({ one }) => ({
  user: one(user, { fields: [profile.userId], references: [user.id] }),
}));

export const userRelations = relations(user, ({ one, many }) => ({
  sessions: many(session),
  accounts: many(account),
  profile: one(profile),
  posts: many(posts),
  comments: many(comments),
  likes: many(likes),
}));

export * from "./auth-schema";
