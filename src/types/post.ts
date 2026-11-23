import type { PostComment } from "./comment";

export interface Post {
	id: string;
	userName: string;
	userImageUrl?: string | null;
	userId?: string | null;
	text: string;
	imageUrl?: string;
	timestamp: string;
	likes: number;
	commentCount?: number;
	comments?: PostComment[];
	isLiked?: boolean;
	isSaved?: boolean;
}

export type PostDetail = Omit<Post, "comments"> & {
	comments: PostComment[];
	isLiked?: boolean;
};
