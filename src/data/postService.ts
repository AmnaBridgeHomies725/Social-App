import type { Post } from "../types/post";
import { posts } from "./posts";

export function getPosts(): Post[] {
	return posts;
}

export function getPostById(postId: number): Post | undefined {
	return posts.find((post) => post.id === postId);
}

export function createPost(text: string, imageUrl = ""): Post {
	const newPost: Post = {
		id: Date.now(),
		author: "Areena",
		text,
		imageUrl,
		timestamp: new Date().toISOString(),
		likes: 0,
		comments: [],
	};
	posts.unshift(newPost);
	return newPost;
}
