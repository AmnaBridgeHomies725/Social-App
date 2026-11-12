export interface Post {
	id: number;
	author: string;
	text: string;
	imageUrl?: string;
	timestamp: string;
	likes: number;
	comments: string[];
	isLiked?: boolean;
}
