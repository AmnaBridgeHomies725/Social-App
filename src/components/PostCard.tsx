import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { toggleLikeServerFn } from "../server/post.function";
import type { Post } from "../types/post";

interface PostCardProps {
	post: Post;
	currentUser: string;
}

function PostCard({ post, currentUser }: PostCardProps) {
	const [likes, setLikes] = useState(post.likes);
	const [liked, setLiked] = useState(post.isLiked ?? false);
	const [isLiking, setIsLiking] = useState(false);

	async function handleLike() {
		if (isLiking) return;

		setIsLiking(true);

		try {
			const data = await toggleLikeServerFn({
				data: {
					postId: post.id,
				},
			});

			setLikes(data.likes);
			setLiked(data.isLiked);
		} finally {
			setIsLiking(false);
		}
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
						 width={800}
        height={500}
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
						disabled={isLiking}
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
