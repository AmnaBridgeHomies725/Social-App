import { relations, sql } from "drizzle-orm";
import {
	type AnyPgColumn,
	index,
	integer,
	pgTable,
	serial,
	text,
	timestamp,
	unique,
	uniqueIndex,
} from "drizzle-orm/pg-core";
import { account, session, user } from "./auth-schema";

export const profiles = pgTable("profiles", {
	userId: text("user_id")
		.primaryKey()
		.references(() => user.id, { onDelete: "cascade" }),
	username: text("username").notNull().unique(),
	bio: text("bio").notNull().default(""),
	imageUrl: text("image_url"),
}, (table) => [uniqueIndex("profiles_username_lower_unique").on(sql`lower(${table.username})`)]);

export const posts = pgTable(
	"posts",
	{
		id: serial("id").primaryKey(),
		userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
		text: text("text").notNull().default(""),
		imageUrl: text("image_url"),
		createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	},
	(table) => [index("idx_posts_created").on(table.createdAt, table.id)],
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
	(table) => [unique("likes_post_user_unique").on(table.postId, table.userId)],
);

export const savedPosts = pgTable(
	"saved_posts",
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
		unique("saved_posts_user_post_unique").on(table.userId, table.postId),
	],
);

export const comments = pgTable(
	"comments",
	{
		id: serial("id").primaryKey(),
		postId: integer("post_id")
			.notNull()
			.references(() => posts.id, { onDelete: "cascade" }),
		userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
		parentCommentId: integer("parent_comment_id").references(
			(): AnyPgColumn => comments.id,
			{ onDelete: "cascade" },
		),
		comment: text("comment").notNull(),
		createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	},
	(table) => [
		index("idx_comments_post").on(table.postId),
		index("idx_comments_parent").on(table.parentCommentId),
	],
);

export const postsRelations = relations(posts, ({ one, many }) => ({
	user: one(user, { fields: [posts.userId], references: [user.id] }),
	comments: many(comments),
	likes: many(likes),
	savedPosts: many(savedPosts),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
	post: one(posts, { fields: [comments.postId], references: [posts.id] }),
	user: one(user, { fields: [comments.userId], references: [user.id] }),
}));

export const likesRelations = relations(likes, ({ one }) => ({
	post: one(posts, { fields: [likes.postId], references: [posts.id] }),
	user: one(user, { fields: [likes.userId], references: [user.id] }),
}));

export const savedPostsRelations = relations(savedPosts, ({ one }) => ({
	post: one(posts, { fields: [savedPosts.postId], references: [posts.id] }),
	user: one(user, { fields: [savedPosts.userId], references: [user.id] }),
}));

export const userRelations = relations(user, ({ one, many }) => ({
	sessions: many(session),
	accounts: many(account),
	posts: many(posts),
	comments: many(comments),
	likes: many(likes),
	savedPosts: many(savedPosts),
	profile: one(profiles),
}));

export const profilesRelations = relations(profiles, ({ one }) => ({
	user: one(user, { fields: [profiles.userId], references: [user.id] }),
}));

export const uploads = pgTable("uploads", {
	id: serial("id").primaryKey(),
	userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
	filePath: text("file_path").notNull().unique(),
	createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export * from "./auth-schema";
