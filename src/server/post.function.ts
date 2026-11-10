import { createServerFn } from "@tanstack/react-start";
import { posts } from "../data/posts";
import db from "./database/db";

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

			return {
				...post,
				likes: dbLikes > 0 ? dbLikes : post.likes,
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
