import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Heart, MessageCircle } from "lucide-react";
import { type FormEvent, useRef, useState } from "react";
import UserAvatar from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";
import CharacterCounter from "../components/CharacterCounter";
import { Textarea } from "@/components/ui/textarea";

import {
	postDetailQueryOptions,
	useCreateCommentMutation,
	useToggleLikeMutation,
} from "../queries/post";
import { myProfileQueryOptions } from "../queries/profile";
import type { PostComment } from "../types/comment";
import type { PostDetail as PostDetailData } from "../types/post";
import { formatRelativeTime } from "../lib/format";
import PostBody from "../components/PostBody";

type PostWithComments = PostDetailData;

export const Route = createFileRoute("/posts/$postId")({
	loader: async ({ params, context }) => {
		const postId = params.postId;

		await Promise.all([
			context.queryClient.fetchQuery({
				...postDetailQueryOptions(postId),
				staleTime: 0,
			}),
			context.queryClient.fetchQuery({
				...myProfileQueryOptions(),
				staleTime: 0,
			}),
		]);
	},
	component: PostDetailRoute,
});

function PostDetailRoute() {
	const { postId } = Route.useParams();
	return <PostDetailWithQuery postId={postId} />;
}

function PostDetailWithQuery({ postId }: { postId: string }) {
	const { data: post } = useSuspenseQuery(postDetailQueryOptions(postId));
	return <PostDetail post={post} />;
}

interface PostDetailProps {
	post: PostWithComments | null;
}

function PostDetail({ post }: PostDetailProps) {
	const [commentText, setCommentText] = useState("");
	const [error, setError] = useState("");
	const [commentsOpen, setCommentsOpen] = useState(false);
	const [replyingTo, setReplyingTo] = useState<{
		commentId: string;
		username: string;
	} | null>(null);
	const [expandedReplies, setExpandedReplies] = useState<Set<string>>(
		new Set(),
	);
	const commentInputRef = useRef<HTMLTextAreaElement>(null);
	const { data: myProfile } = useSuspenseQuery(myProfileQueryOptions());
	const commentMutation = useCreateCommentMutation();
	const likeMutation = useToggleLikeMutation();

	if (!post) {
		return (
			<div className="mx-auto max-w-2xl p-6 text-center">
				<h2 className="text-xl font-semibold">Post not found</h2>
				<Link to="/" className="mt-3 inline-block text-primary hover:underline">
					Back to feed
				</Link>
			</div>
		);
	}

	const currentPostId = post.id;

	async function handleAddComment(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (!commentText.replace(/^@\S+\s*/, "").trim()) {
			setError("Write a comment before posting.");
			return;
		}

		setError("");
		try {
			await commentMutation.mutateAsync({
				postId: currentPostId,
				comment: commentText,
				parentCommentId: replyingTo?.commentId,
			});
			setCommentText("");
			setReplyingTo(null);
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Comment could not be posted.",
			);
		}
	}

	function replyToComment(comment: PostComment) {
		const parentId = comment.parent_comment_id ?? comment.id;
		setReplyingTo({ commentId: parentId, username: comment.user_name });
		setCommentText(`@${comment.user_name} `);
		setExpandedReplies((current) => new Set(current).add(parentId));
		setError("");
		commentInputRef.current?.focus();
	}

	function toggleReplies(commentId: string) {
		setExpandedReplies((current) => {
			const next = new Set(current);
			if (next.has(commentId)) next.delete(commentId);
			else next.add(commentId);
			return next;
		});
	}

	const topLevelComments = post.comments.filter(
		(comment) => !comment.parent_comment_id,
	);

	return (
		<div className="mx-auto w-full max-w-[780px] space-y-4">
			<Link
				to="/"
				className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
			>
				<ArrowLeft size={16} aria-hidden="true" />
				Back to feed
			</Link>

			<article className="post-card-shell">
				<PostBody post={post} detail>
					<div className="post-detail-actions">
						<Button
							type="button"
							variant="outline"
							size="sm"
							disabled={likeMutation.isPending}
							onClick={() => likeMutation.mutate(post.id)}
							aria-pressed={post.isLiked}
						>
							<Heart
								size={16}
								fill={post.isLiked ? "currentColor" : "none"}
								aria-hidden="true"
							/>
							{post.isLiked ? "Liked" : "Like"}
						</Button>
						<span className="text-xs text-muted-foreground">
							{post.likes} likes
						</span>
						<Button
							type="button"
							variant={commentsOpen ? "default" : "outline"}
							size="sm"
							aria-expanded={commentsOpen}
							onClick={() => setCommentsOpen((open) => !open)}
						>
							<MessageCircle size={13} aria-hidden="true" />
							{post.comments.length} comments
						</Button>
					</div>
				</PostBody>

				{commentsOpen && (
					<section className="post-detail-comments">
						<header className="flex items-center justify-between gap-3 border-b border-[var(--line)] px-4 py-3">
							<div>
								<h2 className="font-semibold">Comments</h2>
								<p className="mt-0.5 text-xs text-muted-foreground">
									Join the conversation on this post.
								</p>
							</div>
							<span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-primary/15 px-2 text-xs font-semibold text-primary">
								{post.comments.length}
							</span>
						</header>

						<form
							onSubmit={handleAddComment}
							className="border-b border-[var(--line)] px-4 py-3"
						>
							<div className="flex items-start gap-2.5">
								<UserAvatar
									imageUrl={myProfile.imageUrl}
									name={myProfile.username}
									size={32}
									fallbackClassName="bg-primary/15 text-primary"
								/>
								<Textarea
									ref={commentInputRef}
									rows={1}
									placeholder="Write a comment..."
									value={commentText}
									maxLength={300}
									disabled={commentMutation.isPending}
									onChange={(event) => {
										setCommentText(event.target.value);
										setError("");
									}}
									onKeyDown={(event) => {
										if (event.key === "Enter" && event.ctrlKey) {
											event.preventDefault();
											event.currentTarget.form?.requestSubmit();
										}
									}}
									className="!h-12 !min-h-12 !max-h-12 flex-1 resize-none rounded-xl border bg-background"
								/>
							</div>

							<div className="mt-2 flex flex-wrap items-center justify-between gap-2 pl-10">
								<div className="flex items-center gap-2.5">
									<span className="text-xs text-muted-foreground">
						<CharacterCounter value={commentText} max={300} />
									</span>
									<div className="h-1 w-20 overflow-hidden rounded-full bg-muted">
										<div
											className="h-full rounded-full bg-primary transition-[width]"
											style={{ width: `${(commentText.length / 300) * 100}%` }}
										/>
									</div>
									{replyingTo && (
										<>
											<span className="text-xs text-muted-foreground">Replying to {replyingTo.username}</span>
											<Button type="button" variant="ghost" size="sm" onClick={() => { setReplyingTo(null); setCommentText((text) => /^@\S+\s*$/.test(text) ? "" : text); }}>Cancel</Button>
										</>
									)}
								</div>
								<div className="flex items-center gap-3">
									<Button
										type="submit"
										size="sm"
										className="rounded-full px-5"
										disabled={!commentText.replace(/^@\S+\s*/, "").trim() || commentMutation.isPending}
									>
										{commentMutation.isPending ? "Posting..." : "Post comment"}
									</Button>
								</div>
							</div>
							{error && (
								<p role="alert" className="mt-2 pl-12 text-sm text-destructive">
									{error}
								</p>
							)}
						</form>

						{post.comments.length === 0 ? (
							<div className="px-4 py-6 text-center">
								<div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
									<MessageCircle size={18} aria-hidden="true" />
								</div>
								<p className="mt-3 text-sm font-medium">No comments yet</p>
								<p className="mt-1 text-xs text-muted-foreground">
									Be the first to share your thoughts.
								</p>
							</div>
						) : (
							<div className="divide-y divide-[var(--line)]">
								{topLevelComments.map((comment, index) => {
									const replies = post.comments.filter(
										(reply) => reply.parent_comment_id === comment.id,
									);
									const isExpanded = expandedReplies.has(comment.id);

									return (
										<div key={comment.id} className="px-4 py-3">
											<article className="flex gap-2.5">
												<UserAvatar
													imageUrl={comment.user_image_url}
													name={comment.user_name}
													size={32}
													fallbackClassName={
														index % 3 === 0
															? "bg-cyan-300 text-slate-950"
															: index % 3 === 1
																? "bg-violet-300 text-slate-950"
																: "bg-orange-300 text-slate-950"
													}
												/>
												<div className="min-w-0 flex-1">
													<div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
														<p className="text-sm font-semibold">
															{comment.user_name}
														</p>
														<time
															dateTime={comment.created_at}
															className="text-xs text-muted-foreground"
														>
															{formatRelativeTime(comment.created_at)}
														</time>
													</div>
													<p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6">
														{comment.comment}
													</p>
													<div className="mt-1 flex items-center gap-4">
														<button
															type="button"
															className="text-xs font-medium text-muted-foreground hover:text-primary"
															onClick={() => replyToComment(comment)}
														>
															Reply
														</button>
														{replies.length > 0 && (
															<button
																type="button"
																className="text-xs font-medium text-primary hover:underline"
																onClick={() => toggleReplies(comment.id)}
															>
																{isExpanded
																	? "Hide replies"
																	: `Show ${replies.length} replies`}
															</button>
														)}
													</div>
												</div>
											</article>

											{isExpanded && replies.length > 0 && (
												<div className="ml-10 mt-3 space-y-3 border-l-2 border-primary/20 pl-3">
													{replies.map((reply) => (
														<article key={reply.id} className="flex gap-2.5">
															<UserAvatar
																imageUrl={reply.user_image_url}
																name={reply.user_name}
																size={28}
																fallbackClassName="bg-primary/15 text-primary"
															/>
															<div className="min-w-0 flex-1">
																<div className="flex flex-wrap items-baseline gap-x-2">
																	<p className="text-sm font-semibold">
																		{reply.user_name}
																	</p>
																	<time
																		dateTime={reply.created_at}
																		className="text-xs text-muted-foreground"
																	>
																		{formatRelativeTime(reply.created_at)}
																	</time>
																</div>
																<p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6">
																	{reply.comment}
																</p>
																<button
																	type="button"
																	className="mt-1 text-xs font-medium text-muted-foreground hover:text-primary"
																	onClick={() => replyToComment(reply)}
																>
																	Reply
																</button>
															</div>
														</article>
													))}
												</div>
											)}
										</div>
									);
								})}
							</div>
						)}
					</section>
				)}
			</article>
		</div>
	);
}
