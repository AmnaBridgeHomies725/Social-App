import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { Post } from "../types/post";

interface PostCardProps {
	post: Post;
	currentUser: string;
}

function PostCard({ post, currentUser }: PostCardProps) {
	const [likes, setLikes] = useState(post.likes);
	const [liked, setLiked] = useState(false);

	function handleLike() {
		setLikes(liked ? likes - 1 : likes + 1);
		setLiked(!liked);
	}

	return (
		<Card className="post-card-shell">
			<CardHeader className="post-card-header">
				<h3 className="post-card-author">{post.author}</h3>
				{post.author === currentUser && (
					<Badge variant="secondary">My Post</Badge>
				)}
			</CardHeader>

			<CardContent className="post-card-content">
				{post.imageUrl && (
					<img
						src={post.imageUrl}
						alt={`${post.author}'s post`}
						loading="lazy"
						className="post-card-image"
					/>
				)}

				<p className="text-xs text-muted-foreground">
					{new Date(post.timestamp).toLocaleString()}
				</p>

				<p className="whitespace-pre-wrap break-words">
					{post.text || "No text available"}
				</p>

				<div className="post-card-actions">
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={handleLike}
						aria-pressed={liked}
					>
						{liked ? "❤️ Liked" : "❤️ Like"}
					</Button>

					<span className="text-sm text-muted-foreground">{likes} Likes</span>

					<span className="text-sm text-muted-foreground">
						{post.comments.length} Comments
					</span>

					<Link
						to="/posts/$postId"
						params={{ postId: String(post.id) }}
						className="post-card-details-link"
					>
						View Details →
					</Link>
				</div>
			</CardContent>
		</Card>
	);
}

export default PostCard;
