import { createServerFn } from "@tanstack/react-start";
import type { Comment, FeedRow, PostRow } from "../types/db";
import type { Post } from "../types/post";
import db from "./database/db";
import { getSessionServerFn } from "./session.function";

type PostWithComments = Omit<Post, "comments"> & {
	comments: Comment[];
};

function findPost(postId: number) {
	return db.prepare("SELECT id FROM posts WHERE id = ?").get(postId) as
		| { id: number }
		| undefined;
}

export const getPostsServerFn = createServerFn({
	method: "GET",
})
	.validator(
		(data: { pageSize?: number; cursor?: string; search?: string }) => ({
			pageSize: Math.min(Math.max(data.pageSize ?? 2, 1), 50),
			cursor: data.cursor,
			search: data.search,
		}),
	)
	.handler(async ({ data }) => {
		const session = await getSessionServerFn();
		const search = `%${data.search?.trim() ?? ""}%`;
		const decoded = data.cursor
			? (JSON.parse(Buffer.from(data.cursor, "base64url").toString("utf8")) as {
					createdAt: string;
					id: number;
				})
			: null;
		const rows = db
			.prepare(
				`SELECT
      p.id,
      p.author,
      p.text,
      p.image_url,
      p.created_at,
      (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) AS likes,
      (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS comment_count,
      (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id AND l.user_id = ?) AS liked_by_me
    FROM posts p
    WHERE (p.text LIKE ? OR p.author LIKE ?)
      AND (? IS NULL OR p.created_at < ? OR (p.created_at = ? AND p.id < ?))
    ORDER BY p.created_at DESC, p.id DESC
    LIMIT ?`,
			)
			.all(
				session?.id ?? "",
				search,
				search,
				decoded ? 1 : null,
				decoded?.createdAt ?? null,
				decoded?.createdAt ?? null,
				decoded?.id ?? null,
				data.pageSize + 1,
			) as FeedRow[];

		const hasMore = rows.length > data.pageSize;
		const pageRows = hasMore ? rows.slice(0, data.pageSize) : rows;
		const last = pageRows[pageRows.length - 1];

		return {
			posts: pageRows.map((row) => ({
				id: row.id,
				author: row.author,
				text: row.text,
				imageUrl: row.image_url ?? undefined,
				timestamp: row.created_at,
				likes: row.likes,
				comments: new Array(row.comment_count).fill(""),
				isLiked: row.liked_by_me === 1,
			})),
			hasMore,
			nextCursor:
				hasMore && last
					? Buffer.from(
							JSON.stringify({ createdAt: last.created_at, id: last.id }),
						).toString("base64url")
					: null,
		};
	});

export const createPostServerFn = createServerFn({
	method: "POST",
})
	.validator((data: { text: string; imageUrl: string }) => {
		const trimmedText = typeof data.text === "string" ? data.text.trim() : "";
		const trimmedImageUrl =
			typeof data.imageUrl === "string" ? data.imageUrl.trim() : "";

		if (!trimmedText && !trimmedImageUrl) {
			throw new Error("Please enter text or an image URL.");
		}

		if (trimmedText.length > 500) {
			throw new Error("Post text cannot exceed 500 characters.");
		}

		if (
			trimmedImageUrl &&
			!trimmedImageUrl.startsWith("http://") &&
			!trimmedImageUrl.startsWith("https://")
		) {
			throw new Error("Please enter a valid HTTP or HTTPS image URL.");
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

		const createdAt = new Date().toISOString();

		const result = db
			.prepare(
				"INSERT INTO posts (author, text, image_url, created_at) VALUES (?, ?, ?, ?)",
			)
			.run(session.name, data.text, data.imageUrl || null, createdAt);

		return {
			id: Number(result.lastInsertRowid),
			author: session.name,
			text: data.text,
			imageUrl: data.imageUrl,
			timestamp: createdAt,
			likes: 0,
			comments: [],
		};
	});

export const toggleLikeServerFn = createServerFn({
	method: "POST",
})
	.validator((data: { postId: number }) => {
		if (!Number.isInteger(data.postId)) {
			throw new Error("Invalid post ID");
		}

		return data;
	})
	.handler(async ({ data }) => {
		const session = await getSessionServerFn();
		if (!session) {
			throw new Error("Unauthorized");
		}
		const post = findPost(data.postId);

		if (!post) {
			throw new Error("Post not found");
		}

		const userId = session.id;

		const existingLike = db
			.prepare("SELECT id FROM likes WHERE post_id = ? AND user_id = ?")
			.get(post.id, userId);

		if (existingLike) {
			db.prepare("DELETE FROM likes WHERE post_id = ? AND user_id = ?").run(
				post.id,
				userId,
			);
		} else {
			db.prepare("INSERT INTO likes (post_id, user_id) VALUES (?, ?)").run(
				post.id,
				userId,
			);
		}

		const countRow = db
			.prepare("SELECT COUNT(*) as count FROM likes WHERE post_id = ?")
			.get(post.id) as { count: number };

		return {
			postId: post.id,
			likes: countRow.count,
			isLiked: !existingLike,
		};
	});

export const createCommentServerFn = createServerFn({
	method: "POST",
})
	.validator((data: { postId: number; comment: string }) => {
		const trimmedComment = data.comment.trim();

		if (!Number.isInteger(data.postId)) {
			throw new Error("Invalid post ID");
		}

		if (!trimmedComment) {
			throw new Error("Comment cannot be empty");
		}

		if (trimmedComment.length > 300) {
			throw new Error("Comment cannot exceed 300 characters");
		}

		return {
			postId: data.postId,
			comment: trimmedComment,
		};
	})
	.handler(async ({ data }) => {
		const session = await getSessionServerFn();
		if (!session) {
			throw new Error("Unauthorized");
		}
		const post = findPost(data.postId);

		if (!post) {
			throw new Error("Post not found");
		}

		const result = db
			.prepare(
				"INSERT INTO comments (post_id, user_id, comment) VALUES (?, ?, ?)",
			)
			.run(data.postId, session.name, data.comment);

		const newComment = db
			.prepare(
				`SELECT id, post_id, user_id, comment, created_at
				FROM comments
				WHERE id = ?`,
			)
			.get(result.lastInsertRowid) as Comment | undefined;

		if (!newComment) {
			throw new Error("Comment could not be created");
		}

		return newComment;
	});

export const getPostByIdServerFn = createServerFn({
	method: "GET",
})
	.validator((data: { postId: number }) => {
		if (!Number.isInteger(data.postId)) {
			throw new Error("Invalid post ID");
		}

		return data;
	})
	.handler(async ({ data }): Promise<PostWithComments | null> => {
		const row = db
			.prepare(
				`SELECT
					p.id,
					p.author,
					p.text,
					p.image_url,
					p.created_at,
					(SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) AS likes
				FROM posts p
				WHERE p.id = ?`,
			)
			.get(data.postId) as PostRow | undefined;

		if (!row) {
			return null;
		}

		const comments = db
			.prepare(
				`SELECT id, post_id, user_id, comment, created_at
				FROM comments
				WHERE post_id = ?
				ORDER BY created_at ASC, id ASC`,
			)
			.all(data.postId) as Comment[];

		return {
			id: row.id,
			author: row.author,
			text: row.text,
			imageUrl: row.image_url ?? undefined,
			timestamp: row.created_at,
			likes: row.likes,
			comments,
		};
	});
