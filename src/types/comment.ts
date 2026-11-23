export interface PostComment {
	id: string;
	post_id: string;
	parent_comment_id: string | null;
	user_id: string;
	user_name: string;
	user_image_url: string | null;
	comment: string;
	created_at: string;
}
