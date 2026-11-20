import type { PostComment } from "./comment";

export interface Post {
	id: string;
	author: string;
	authorId?: string | null;
	text: string;
	imageUrl?: string;
	timestamp: string;
	likes: number;
	commentCount?: number;
	comments?: PostComment[];
	isLiked?: boolean;

}


export type PostDetail = Omit<Post, "comments"> & {
	comments: PostComment[];
	isLiked?: boolean;
};
