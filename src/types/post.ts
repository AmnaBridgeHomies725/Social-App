export interface Post {
	id: number;
	author: string;
	authorId?: string | null;
	text: string;
	imageUrl?: string;
	timestamp: string;
	likes: number;
	comments: string[];
	isLiked?: boolean;
}
