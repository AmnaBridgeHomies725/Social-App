import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { createServerFn } from "@tanstack/react-start";
import { and, asc, desc, eq, lt, or, sql, type SQL } from "drizzle-orm";
import pgDb from "./database/postgres-db";

import {
	comments,
	likes,
	posts,
	profiles,
	savedPosts,
	uploads,
	user,
} from "./database/schema";
import { getSessionServerFn } from "./session.function";
import { detectImageType, getUploadDir, UPLOAD_PATH_REGEX } from "./uploads";

function parsePostId(value: unknown): number {
	const id = Number(value);
	if (!Number.isInteger(id) || id <= 0) {
		throw new Error("Invalid post ID");
	}
	return id;
}

export const getPostsServerFn = createServerFn({
	method: "GET",
})
	.validator(
		(data: { pageSize?: number; cursor?: string }) => ({
			pageSize: Math.min(Math.max(data.pageSize ?? 10, 1), 50),
			cursor: data.cursor,
		}),
	)
	.handler(async ({ data }) => {
		const session = await getSessionServerFn();
		let decoded: { createdAt: Date; id: string } | null = null;
		if (data.cursor) {
			try {
				const parsed = JSON.parse(
					Buffer.from(data.cursor, "base64url").toString("utf8"),
				);
				if (
					!parsed ||
					typeof parsed !== "object" ||
					!parsed.createdAt ||
					parsed.id === undefined ||
					parsed.id === null
				) {
					throw new Error("Invalid cursor");
				}
				decoded = {
					createdAt: new Date(parsed.createdAt),
					id: String(parsed.id),
				};
			} catch {
				throw new Error("Invalid cursor");
			}
		}

		const conditions: SQL[] = [];

		if (decoded) {
			const cursorCondition = or(
				lt(posts.createdAt, decoded.createdAt),
				and(
					eq(posts.createdAt, decoded.createdAt),
					lt(posts.id, Number(decoded.id)),
				),
			);
			if (cursorCondition) {
				conditions.push(cursorCondition);
			}
		}

		const rows = await pgDb
			.select({
				id: posts.id,
				userId: posts.userId,
				userName: sql<string>`COALESCE(${profiles.username}, ${user.name})`,
				userImageUrl: profiles.imageUrl,
				text: posts.text,
				imageUrl: posts.imageUrl,
				createdAt: posts.createdAt,
				likes: sql<number>`(
          SELECT COUNT(*)::int FROM "likes" WHERE "likes"."post_id" = "posts"."id"
        )`,
				commentCount: sql<number>`(
          SELECT COUNT(*)::int FROM "comments" WHERE "comments"."post_id" = "posts"."id"
        )`,
				likedByMe: session
					? sql<number>`(
              SELECT COUNT(*)::int FROM "likes"
              WHERE "likes"."post_id" = "posts"."id"
              AND "likes"."user_id" = ${session.id}
            )`
					: sql<number>`0`,
				isSaved: session
					? sql<number>`(SELECT COUNT(*)::int FROM "saved_posts" WHERE "saved_posts"."post_id" = "posts"."id" AND "saved_posts"."user_id" = ${session.id})`
					: sql<number>`0`,
			})
			.from(posts)
			.leftJoin(user, eq(posts.userId, user.id))
			.leftJoin(profiles, eq(posts.userId, profiles.userId))
			.where(and(...conditions))
			.orderBy(desc(posts.createdAt), desc(posts.id))
			.limit(data.pageSize + 1);

		const hasMore = rows.length > data.pageSize;
		const pageRows = hasMore ? rows.slice(0, data.pageSize) : rows;

		const last = pageRows[pageRows.length - 1];

		return {
			posts: pageRows.map((row) => ({
				id: String(row.id),
				userName: row.userName ?? "Unknown",
				userImageUrl: row.userImageUrl ?? null,
				userId: row.userId ?? undefined,
				text: row.text,
				imageUrl: row.imageUrl ?? undefined,
				timestamp: row.createdAt.toISOString(),
				likes: row.likes,
				commentCount: row.commentCount,
				isLiked: row.likedByMe > 0,
				isSaved: row.isSaved > 0,
			})),
			hasMore,
			nextCursor:
				hasMore && last
					? Buffer.from(
							JSON.stringify({
								createdAt: last.createdAt.toISOString(),
								id: String(last.id),
							}),
						).toString("base64url")
					: null,
		};
	});

export const getSavedPostsServerFn = createServerFn({ method: "GET" }).handler(
	async () => {
		const session = await getSessionServerFn();
		if (!session) throw new Error("Unauthorized");

		const rows = await pgDb
			.select({
				id: posts.id,
				userId: posts.userId,
				userName: sql<string>`COALESCE(${profiles.username}, ${user.name})`,
				userImageUrl: profiles.imageUrl,
				text: posts.text,
				imageUrl: posts.imageUrl,
				createdAt: posts.createdAt,
				likes: sql<number>`(SELECT COUNT(*)::int FROM "likes" WHERE "likes"."post_id" = "posts"."id")`,
				commentCount: sql<number>`(SELECT COUNT(*)::int FROM "comments" WHERE "comments"."post_id" = "posts"."id")`,
				likedByMe: sql<number>`(SELECT COUNT(*)::int FROM "likes" WHERE "likes"."post_id" = "posts"."id" AND "likes"."user_id" = ${session.id})`,
			})
			.from(savedPosts)
			.innerJoin(posts, eq(savedPosts.postId, posts.id))
			.leftJoin(user, eq(posts.userId, user.id))
			.leftJoin(profiles, eq(posts.userId, profiles.userId))
			.where(eq(savedPosts.userId, session.id))
			.orderBy(desc(savedPosts.id));

		return rows.map((row) => ({
			id: String(row.id),
			userName: row.userName ?? "Unknown",
			userImageUrl: row.userImageUrl ?? null,
			userId: row.userId ?? undefined,
			text: row.text,
			imageUrl: row.imageUrl ?? undefined,
			timestamp: row.createdAt.toISOString(),
			likes: row.likes,
			commentCount: row.commentCount,
			isLiked: row.likedByMe > 0,
			isSaved: true,
		}));
	},
);

export const getSavedCountServerFn = createServerFn({ method: "GET" }).handler(async () => {
	const session = await getSessionServerFn();
	if (!session) return 0;
	const [row] = await pgDb.select({ count: sql<number>`count(*)::int` }).from(savedPosts).where(eq(savedPosts.userId, session.id));
	return row?.count ?? 0;
});

export const createPostServerFn = createServerFn({
	method: "POST",
})
	.validator((data: { text: string; imageUrl: string }) => {
		const trimmedText = data.text.trim();
		const trimmedImageUrl = data.imageUrl.trim();

		if (!trimmedText) {
			throw new Error("Post text cannot be empty.");
		}

		if (trimmedText.length > 500) {
			throw new Error("Post cannot exceed 500 characters.");
		}

		const isValidExternalUrl = /^https?:\/\/\S+$/i.test(trimmedImageUrl);
		const isValidLocalUpload = UPLOAD_PATH_REGEX.test(trimmedImageUrl);

		if (trimmedImageUrl && !isValidExternalUrl && !isValidLocalUpload) {
			throw new Error("Please enter a valid image URL.");
		}

		return {
			text: trimmedText,
			imageUrl: trimmedImageUrl,
		};
	})
	.handler(async ({ data }) => {
		const session = await getSessionServerFn();

		if (!session) {
			throw new Error("Unauthorized");
		}

		const [profile] = await pgDb
			.select({ username: profiles.username, imageUrl: profiles.imageUrl })
			.from(profiles)
			.where(eq(profiles.userId, session.id))
			.limit(1);

		const [newPost] = await pgDb
			.insert(posts)
			.values({
				userId: session.id,
				text: data.text,
				imageUrl: data.imageUrl || null,
				createdAt: new Date(),
			})
			.returning();

		return {
			id: String(newPost.id),
			userName: profile?.username ?? session.name,
			userImageUrl: profile?.imageUrl ?? null,
			userId: newPost.userId ?? undefined,
			text: newPost.text,
			imageUrl: newPost.imageUrl ?? undefined,
			timestamp: newPost.createdAt.toISOString(),
			likes: 0,
			commentCount: 0,
			isLiked: false,
			isSaved: false,
			comments: [],
		};
	});

export const toggleLikeServerFn = createServerFn({
	method: "POST",
})
	.validator((data: { postId: string | number }) => ({
		postId: parsePostId(data.postId),
	}))
	.handler(async ({ data }) => {
		const session = await getSessionServerFn();

		if (!session) {
			throw new Error("Unauthorized");
		}

		const [post] = await pgDb
			.select({ id: posts.id })
			.from(posts)
			.where(eq(posts.id, data.postId))
			.limit(1);

		if (!post) {
			throw new Error("Post not found");
		}

		const removed = await pgDb
			.delete(likes)
			.where(and(eq(likes.postId, post.id), eq(likes.userId, session.id)))
			.returning({ postId: likes.postId });

		let isLiked: boolean;

		if (removed.length > 0) {
			isLiked = false;
		} else {
			await pgDb.insert(likes).values({ postId: post.id, userId: session.id });
			isLiked = true;
		}

		const [countRow] = await pgDb
			.select({
				count: sql<number>`count(*)::int`,
			})
			.from(likes)
			.where(eq(likes.postId, post.id));

		return {
			postId: String(post.id),
			likes: countRow?.count ?? 0,
			isLiked,
		};
	});

export const toggleSavePostServerFn = createServerFn({ method: "POST" })
	.validator((data: { postId: string | number }) => ({
		postId: parsePostId(data.postId),
	}))
	.handler(async ({ data }) => {
		const session = await getSessionServerFn();
		if (!session) throw new Error("Unauthorized");

		const [post] = await pgDb
			.select({ id: posts.id })
			.from(posts)
			.where(eq(posts.id, data.postId))
			.limit(1);
		if (!post) throw new Error("Post not found");

		const removed = await pgDb
			.delete(savedPosts)
			.where(
				and(eq(savedPosts.postId, post.id), eq(savedPosts.userId, session.id)),
			)
			.returning({ id: savedPosts.id });
		const isSaved = removed.length === 0;
		if (isSaved)
			await pgDb
				.insert(savedPosts)
				.values({ postId: post.id, userId: session.id });
		return { postId: String(post.id), isSaved };
	});

export const createCommentServerFn = createServerFn({
	method: "POST",
})
	.validator(
		(data: {
			postId: string | number;
			comment: string;
			parentCommentId?: string | number;
		}) => {
			const postId = parsePostId(data.postId);
			const parentCommentId = data.parentCommentId
				? parsePostId(data.parentCommentId)
				: null;
			const trimmed = data.comment.trim();

			if (!trimmed) {
				throw new Error("Comment cannot be empty");
			}

			if (trimmed.length > 300) {
				throw new Error("Comment cannot exceed 300 characters");
			}

			return {
				postId,
				parentCommentId,
				comment: trimmed,
			};
		},
	)
	.handler(async ({ data }) => {
		const session = await getSessionServerFn();

		if (!session) {
			throw new Error("Unauthorized");
		}

		const [profile] = await pgDb
			.select({ username: profiles.username, imageUrl: profiles.imageUrl })
			.from(profiles)
			.where(eq(profiles.userId, session.id))
			.limit(1);

		const [post] = await pgDb
			.select({ id: posts.id })
			.from(posts)
			.where(eq(posts.id, data.postId))
			.limit(1);

		if (!post) {
			throw new Error("Post not found");
		}

		if (data.parentCommentId) {
			const [parentComment] = await pgDb
				.select({
					id: comments.id,
					postId: comments.postId,
					parentCommentId: comments.parentCommentId,
				})
				.from(comments)
				.where(eq(comments.id, data.parentCommentId))
				.limit(1);

			if (!parentComment || parentComment.postId !== data.postId) {
				throw new Error(
					"The parent comment for this reply was not found on this post.",
				);
			}
			if (parentComment.parentCommentId) {
				throw new Error("Replies can only be added to an original comment.");
			}
		}

		const [newComment] = await pgDb
			.insert(comments)
			.values({
				postId: data.postId,
				userId: session.id,
				parentCommentId: data.parentCommentId,
				comment: data.comment,
				createdAt: new Date(),
			})
			.returning();

		if (!newComment) {
			throw new Error("Comment could not be created");
		}

		return {
			id: String(newComment.id),
			post_id: String(newComment.postId),
			parent_comment_id: newComment.parentCommentId
				? String(newComment.parentCommentId)
				: null,
			user_id: String(newComment.userId ?? ""),
			user_name: profile?.username ?? session.name,
			user_image_url: profile?.imageUrl ?? null,
			comment: newComment.comment,
			created_at: newComment.createdAt.toISOString(),
		};
	});

export const getPostByIdServerFn = createServerFn({
	method: "GET",
})
	.validator((data: { postId: string | number }) => ({
		postId: parsePostId(data.postId),
	}))
	.handler(async ({ data }) => {
		const session = await getSessionServerFn();

		const [post] = await pgDb
			.select({
				id: posts.id,
				userName: sql<string>`COALESCE(${profiles.username}, ${user.name})`,
				userImageUrl: profiles.imageUrl,
				userId: posts.userId,
				text: posts.text,
				imageUrl: posts.imageUrl,
				createdAt: posts.createdAt,
				likes: sql<number>`(
          SELECT COUNT(*)::int
          FROM "likes"
          WHERE "likes"."post_id" = "posts"."id"
        )`,
				likedByMe: session
					? sql<number>`(
              SELECT COUNT(*)::int
              FROM "likes"
              WHERE "likes"."post_id" = "posts"."id"
              AND "likes"."user_id" = ${session.id}
            )`
					: sql<number>`0`,
				isSaved: session
					? sql<number>`(SELECT COUNT(*)::int FROM "saved_posts" WHERE "saved_posts"."post_id" = "posts"."id" AND "saved_posts"."user_id" = ${session.id})`
					: sql<number>`0`,
			})
			.from(posts)
			.leftJoin(user, eq(posts.userId, user.id))
			.leftJoin(profiles, eq(posts.userId, profiles.userId))
			.where(eq(posts.id, data.postId))
			.limit(1);

		if (!post) {
			return null;
		}

		const commentRows = await pgDb
			.select({
				id: comments.id,
				post_id: comments.postId,
				parent_comment_id: comments.parentCommentId,
				user_id: comments.userId,
				user_name: sql<string>`COALESCE(${profiles.username}, ${user.name})`,
				user_image_url: profiles.imageUrl,
				comment: comments.comment,
				created_at: comments.createdAt,
			})
			.from(comments)
			.leftJoin(user, eq(comments.userId, user.id))
			.leftJoin(profiles, eq(comments.userId, profiles.userId))
			.where(eq(comments.postId, data.postId))
			.orderBy(asc(comments.createdAt), asc(comments.id));

		return {
			id: String(post.id),
			userName: post.userName ?? "Unknown",
			userImageUrl: post.userImageUrl ?? null,
			userId: post.userId ?? undefined,
			text: post.text,
			imageUrl: post.imageUrl ?? undefined,
			timestamp: post.createdAt.toISOString(),
			likes: post.likes,
			comments: commentRows.map((c) => ({
				id: String(c.id),
				post_id: String(c.post_id),
				parent_comment_id: c.parent_comment_id
					? String(c.parent_comment_id)
					: null,
				user_id: String(c.user_id ?? ""),
				user_name: c.user_name ?? "Unknown",
				user_image_url: c.user_image_url ?? null,
				comment: c.comment,
				created_at: c.created_at.toISOString(),
			})),
			isLiked: post.likedByMe > 0,
			isSaved: post.isSaved > 0,
		};
	});

export const uploadImageServerFn = createServerFn({
	method: "POST",
})
	.validator((data: FormData) => data)
	.handler(async ({ data }) => {
		const session = await getSessionServerFn();

		if (!session) {
			throw new Error("Unauthorized");
		}

		const file = data.get("image");

		if (!(file instanceof File)) {
			throw new Error("No image file provided.");
		}

		const allowedTypes: Record<string, string> = {
			"image/jpeg": ".jpg",
			"image/png": ".png",
			"image/webp": ".webp",
		};

		if (!allowedTypes[file.type]) {
			throw new Error("Only JPG, PNG, and WEBP images are allowed.");
		}

		if (file.size > 5 * 1024 * 1024) {
			throw new Error("Image size must be less than 5 MB.");
		}

		const buffer = Buffer.from(await file.arrayBuffer());
		if (detectImageType(buffer) !== file.type) {
			throw new Error("Invalid image file format.");
		}

		const filename = `${randomUUID()}${allowedTypes[file.type]}`;

		const uploadDirectory = getUploadDir();

		await mkdir(uploadDirectory, { recursive: true });

		await writeFile(path.join(uploadDirectory, filename), buffer);
		try {
			await pgDb.insert(uploads).values({ userId: session.id, filePath: `/uploads/${filename}` });
		} catch (error) {
			await unlink(path.join(uploadDirectory, filename)).catch(() => undefined);
			throw error;
		}

		return {
			imageUrl: `/uploads/${filename}`,
		};
	});

export const deleteUploadedImageServerFn = createServerFn({
	method: "POST",
})
	.validator((data: { imageUrl: string }) => {
		if (typeof data.imageUrl !== "string") {
			throw new Error("Invalid image URL");
		}
		return data;
	})
	.handler(async ({ data }) => {
		const session = await getSessionServerFn();

		if (!session) {
			throw new Error("Unauthorized");
		}

		if (!UPLOAD_PATH_REGEX.test(data.imageUrl)) {
			throw new Error("Invalid file path");
		}

		const filename = path.basename(data.imageUrl);
		const [ownedUpload] = await pgDb.select({ id: uploads.id }).from(uploads)
			.where(and(eq(uploads.filePath, data.imageUrl), eq(uploads.userId, session.id))).limit(1);
		if (!ownedUpload) throw new Error("Not allowed");
		const targetPath = path.join(getUploadDir(), filename);

		await unlink(targetPath).catch((error: NodeJS.ErrnoException) => {
			if (error.code !== "ENOENT") throw error;
		});

		await pgDb.delete(uploads).where(eq(uploads.id, ownedUpload.id));
		return { success: true };
	});
