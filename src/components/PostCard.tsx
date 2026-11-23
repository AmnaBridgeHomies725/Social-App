import { Bookmark, Heart, MessageCircle } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useToggleLikeMutation, useToggleSavePostMutation } from "../queries/post";
import type { Post } from "../types/post";
import PostBody from "./PostBody";

function PostCard({ post }: { post: Post }) {
	const likeMutation = useToggleLikeMutation();
	const saveMutation = useToggleSavePostMutation();
	return <article className="post-card-shell">
		<PostBody post={post} summary />
		<footer className="post-card-action-bar">
			<button type="button" className={`post-card-action${post.isLiked ? " is-active" : ""}`} onClick={() => likeMutation.mutate(post.id)} disabled={likeMutation.isPending} aria-pressed={post.isLiked ?? false}><Heart size={15} fill={post.isLiked ? "currentColor" : "none"} />{post.isLiked ? "Liked" : "Like"}</button>
			<Link to="/posts/$postId" params={{ postId: post.id }} className="post-card-action"><MessageCircle size={15} /> Comment</Link>
			<button type="button" className={`post-card-action${post.isSaved ? " is-saved" : ""}`} onClick={() => saveMutation.mutate(post.id)} disabled={saveMutation.isPending} aria-pressed={post.isSaved ?? false}><Bookmark size={15} fill={post.isSaved ? "currentColor" : "none"} />{post.isSaved ? "Saved" : "Save"}</button>
		</footer>
	</article>;
}

export default PostCard;
