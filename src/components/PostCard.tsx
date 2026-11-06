import { useState } from "react";
import { Link } from "@tanstack/react-router";
import type { Post } from "../types/post";
import "../styles/PostCard.css";

interface PostCardProps {
	post: Post;
	currentUser: string;
}

function PostCard({ post, currentUser }: PostCardProps) {
	const [likes, setLikes] = useState(post.likes);
	function handleLike() {
		console.log("Like button clicked!");
		setLikes((previousLikes) => previousLikes + 1);
	}

	return (
		<div className="post-card">
			<div className="post-header">
				<h3>{post.author}</h3>

				{post.author === currentUser && (
					<span className="my-post-badge">My Post</span>
				)}
			</div>
			<div className="post-image">
				<img src={post.imageUrl} alt={`${post.author}'s post`} loading="lazy" />
</div>
<div className="post-timestamp">{new Date(post.timestamp).toLocaleString()}</div>

			<p>{post.text}</p>

			<div className="post-actions">
				<button type="button" onClick={handleLike}>
					Like 
				</button>

				<span>{likes} Likes</span>

				<span>{post.comments.length} Comments</span>
				<Link
					to="/posts/$postId"
					params={{ postId: String(post.id) }}
					className="view-details-link"
				>
					View Details
				</Link>
			</div>
		</div>
	);
}

export default PostCard;
