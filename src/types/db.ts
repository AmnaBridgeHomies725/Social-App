export interface Comment {
	id: number;
	post_id: number;
	user_id: string;
	comment: string;
	created_at: string;
}

export type FeedRow = {
	id: number;
	author: string;
	text: string;
	image_url: string | null;
	created_at: string;
	likes: number;
	comment_count: number;
};

export type PostRow = {
	id: number;
	author: string;
	text: string;
	image_url: string | null;
	created_at: string;
	likes: number;
};