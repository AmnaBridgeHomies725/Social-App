import { createFileRoute, Link } from "@tanstack/react-router";
import { Send } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
	createCommentServerFn,
	getPostByIdServerFn,
} from "../server/post.function";
import type { Post } from "../types/post";

interface Comment {
	id: number;
	post_id: number;
	user_id: string;
	comment: string;
	created_at: string;
}

type PostWithComments = Omit<Post, "comments"> & {
	comments: Comment[];
};

export const Route = createFileRoute("/posts/$postId")({
	loader: async ({ params }) => {
		const postId = Number(params.postId);

		if (!Number.isInteger(postId)) {
			return null;
		}

		return await getPostByIdServerFn({
			data: { postId },
		});
	},
	component: PostDetailRoute,
});

function PostDetailRoute() {
	const post = Route.useLoaderData() as PostWithComments | null;

	return <PostDetail post={post} />;
}

interface PostDetailProps {
	post: PostWithComments | null;
}

function PostDetail({ post }: PostDetailProps) {
	const [commentText, setCommentText] = useState("");
	const [comments, setComments] = useState<Comment[]>(post?.comments ?? []);
	const [error, setError] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	useEffect(() => {
		setComments(post?.comments ?? []);
	}, [post]);

	if (!post) {
		return (
			<div className="p-6 text-center">
				<h2 className="text-xl font-semibold">Post not found</h2>
				<Link to="/" className="text-blue-500 underline">
					Back to feed
				</Link>
			</div>
		);
	}

	const currentPost = post;

	async function handleAddComment() {
		if (!commentText.trim()) {
			setError("Comment cannot be empty");
			return;
		}

		setIsSubmitting(true);
		setError("");

		try {
			await createCommentServerFn({
				data: {
					postId: currentPost.id,
					comment: commentText,
				},
			});

			const updatedPost = await getPostByIdServerFn({
				data: {
					postId: currentPost.id,
				},
			});

			setComments(updatedPost?.comments ?? []);
			setCommentText("");
		} catch (err) {
			setError(err instanceof Error ? err.message : "Something went wrong");
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<div className="mx-auto max-w-2xl space-y-4 p-4">
			<Link to="/" className="text-sm text-blue-500 hover:underline">
				← Back to feed
			</Link>

			<Card>
				<CardHeader>
					<CardTitle>{post.author}</CardTitle>
					<p className="text-sm text-muted-foreground">{post.timestamp}</p>
				</CardHeader>

				<CardContent className="space-y-4">
					{post.imageUrl && (
						<img
							src={post.imageUrl}
							alt="Post"
							className="aspect-[16/10] w-full rounded-lg object-cover"
						/>
					)}

					<p className="whitespace-pre-wrap">{post.text}</p>

					<div className="flex gap-3">
						<Badge variant="secondary">❤️ {post.likes} Likes</Badge>

						<Badge variant="secondary">💬 {comments.length} Comments</Badge>
					</div>

					<div className="space-y-3 border-t pt-4">
						<h3 className="font-semibold">Add a comment</h3>

						<div className="flex w-full items-center gap-2">
							<Textarea
								rows={1}
								placeholder="Write a comment..."
								value={commentText}
								onChange={(e) => setCommentText(e.target.value)}
								maxLength={300}
								className="!h-10 !min-h-0 !max-h-10 flex-1 resize-none overflow-hidden rounded-full py-2"
							/>

							<Button
								size="icon"
								className="h-11 w-11 shrink-0 rounded-full"
								disabled={!commentText.trim() || isSubmitting}
								onClick={handleAddComment}
							>
								<Send size={18} />
							</Button>
						</div>

						<p className="text-xs text-muted-foreground">
							{commentText.length}/300 characters
						</p>

						{error && <p className="text-sm text-red-500">{error}</p>}
					</div>

					<div className="space-y-3 border-t pt-4">
						<h3 className="font-semibold">Comments</h3>

						{comments.length === 0 ? (
							<p className="text-sm text-muted-foreground">
								No comments yet. Be the first to comment!
							</p>
						) : (
							<div className="space-y-2">
								{comments.map((comment) => (
									<div
										key={comment.id}
										className="rounded-lg bg-muted p-3 text-sm"
									>
										<p className="font-semibold">{comment.user_id}</p>

										<p className="mt-1 whitespace-pre-wrap">
											{comment.comment}
										</p>

										<p className="mt-2 text-xs text-muted-foreground">
											{comment.created_at}
										</p>
									</div>
								))}
							</div>
						)}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
