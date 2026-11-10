import { createServerFn } from "@tanstack/react-start";
import { posts } from "../data/posts";
import type { Post } from "../types/post";
import db from "./database/db";

interface Comment {
	id: number;
	post_id: number;
	user_id: string;
	comment: string;
	created_at: string;
}

type PostWithComments = Omit<Post, "comments"> & {
	comments: Comment[];
};

export const getPostsServerFn = createServerFn({
	method: "GET",
})
	.validator(
		(data: { pageSize: number; offset: number; userId?: string }) => data,
	)
	.handler(async ({ data }) => {
		const slice = posts.slice(data.offset, data.offset + data.pageSize);

		return slice.map((post) => {
			const countRow = db
				.prepare("SELECT COUNT(*) as count FROM likes WHERE post_id = ?")
				.get(post.id) as { count: number } | undefined;

			const isLikedRow = data.userId
				? db
						.prepare("SELECT id FROM likes WHERE post_id = ? AND user_id = ?")
						.get(post.id, data.userId)
				: null;

			const dbLikes = countRow?.count ?? 0;

			const commentsCountRow = db
				.prepare("SELECT COUNT(*) as count FROM comments WHERE post_id = ?")
				.get(post.id) as { count: number } | undefined;

			const dbCommentsCount = commentsCountRow?.count ?? 0;
			const initialCommentsCount = Array.isArray(post.comments)
				? post.comments.length
				: 0;
			const totalCommentsCount = Math.max(
				dbCommentsCount,
				initialCommentsCount,
			);

			return {
				...post,
				likes: dbLikes > 0 ? dbLikes : post.likes,
				comments: new Array(totalCommentsCount).fill(""),
				isLiked: Boolean(isLikedRow),
			};
		});
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
		const newPost = {
			id: Date.now(),
			author: data.author,
			text: data.text,
			imageUrl: data.imageUrl,
			timestamp: new Date().toISOString(),
			likes: 0,
			comments: [],
		};

		posts.unshift(newPost);

		return newPost;
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
		const post = posts.find((item) => item.id === data.postId);

		if (!post) {
			throw new Error("Post not found");
		}

		const userId = data.userId || "practice-user-1";

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

		post.likes = countRow.count;

		return {
			postId: post.id,
			likes: post.likes,
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
		const post = posts.find((item) => item.id === data.postId);

		if (!post) {
			throw new Error("Post not found");
		}

		const userId = data.userId || "User";

		const result = db
			.prepare(
				`INSERT INTO comments (post_id, user_id, comment)
         VALUES (?, ?, ?)`,
			)
			.run(data.postId, userId, data.comment);

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
		const post = posts.find((item) => item.id === data.postId);

		if (!post) {
			return null;
		}

		let comments = db
			.prepare(
				`SELECT id, post_id, user_id, comment, created_at
         FROM comments
         WHERE post_id = ?
         ORDER BY created_at ASC, id ASC`,
			)
			.all(data.postId) as Comment[];

		if (
			comments.length === 0 &&
			Array.isArray(post.comments) &&
			post.comments.length > 0
		) {
			const insert = db.prepare(
				"INSERT INTO comments (post_id, user_id, comment) VALUES (?, ?, ?)",
			);
			for (const c of post.comments) {
				insert.run(post.id, "Community Member", c);
			}
			comments = db
				.prepare(
					`SELECT id, post_id, user_id, comment, created_at
           FROM comments
           WHERE post_id = ?
           ORDER BY created_at ASC, id ASC`,
				)
				.all(data.postId) as Comment[];
		}

		return {
			...post,
			comments,
		};
	});
