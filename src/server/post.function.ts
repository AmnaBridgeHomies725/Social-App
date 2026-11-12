import { createServerFn } from "@tanstack/react-start";
import type { Post } from "../types/post";
import type { Comment, FeedRow, PostRow } from "../types/db";
import db from "./database/db";

const PRACTICE_USER_ID = "practice-user-1";
type PostWithComments = Omit<Post, "comments"> & {
	comments: Comment[];
};

function findPost(postId: number) {
	return db
		.prepare("SELECT id FROM posts WHERE id = ?")
		.get(postId) as { id: number } | undefined;
}

export const getPostsServerFn = createServerFn({
	method: "GET",
})
	.validator(
		(data: { pageSize: number; offset: number; userId?: string }) => data,
	)
	.handler(async ({ data }) => {
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
				ORDER BY p.created_at DESC, p.id DESC
				LIMIT ? OFFSET ?`,
			)
			.all(PRACTICE_USER_ID, data.pageSize, data.offset) as FeedRow[];

		return rows.map((row) => ({
			id: row.id,
			author: row.author,
			text: row.text,
			imageUrl: row.image_url ?? undefined,
			timestamp: row.created_at,
			likes: row.likes,
			comments: new Array(row.comment_count).fill(""),
			isLiked: row.liked_by_me === 1,
		}));
	});

export const createPostServerFn = createServerFn({
	method: "POST",
})
	.validator((data: { text: string; imageUrl: string; author?: string }) => {
		const trimmedText = data.text.trim();
		const trimmedImageUrl = data.imageUrl.trim();

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
			author: data.author?.trim() || "Areena",
		};
	})
	.handler(async ({ data }) => {
		const createdAt = new Date().toISOString();

		const result = db
			.prepare(
				"INSERT INTO posts (author, text, image_url, created_at) VALUES (?, ?, ?, ?)",
			)
			.run(data.author, data.text, data.imageUrl || null, createdAt);

		return {
			id: Number(result.lastInsertRowid),
			author: data.author,
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
	.validator((data: { postId: number; userId?: string }) => {
		if (!Number.isInteger(data.postId)) {
			throw new Error("Invalid post ID");
		}

		return data;
	})
	.handler(async ({ data }) => {
		const post = findPost(data.postId);

		if (!post) {
			throw new Error("Post not found");
		}

		const userId = PRACTICE_USER_ID;

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
	.validator((data: { postId: number; comment: string; userId?: string }) => {
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
			userId: data.userId?.trim() || "User",
		};
	})
	.handler(async ({ data }) => {
		const post = findPost(data.postId);

		if (!post) {
			throw new Error("Post not found");
		}

		const result = db
			.prepare(
				"INSERT INTO comments (post_id, user_id, comment) VALUES (?, ?, ?)",
			)
			.run(data.postId, data.userId, data.comment);

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