import { createFileRoute, Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getPostById } from "../data/postService";

export const Route = createFileRoute("/posts/$postId")({
	component: PostDetailRoute,
});

interface PostDetailProps {
	postId: string;
}

function PostDetailRoute() {
	const { postId } = Route.useParams();

	return <PostDetail postId={postId} />;
}

function PostDetail({ postId }: PostDetailProps) {
	const post = getPostById(Number(postId));

	if (!post) {
		return (
			<Card className="mx-auto mt-10 max-w-lg">
				<CardContent className="p-8 text-center">
					<h2 className="text-xl font-semibold text-destructive">
						Post not found!
					</h2>
					<Link
						to="/"
						className="mt-4 inline-block text-sm text-primary hover:underline"
					>
						← Back to Home
					</Link>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="mx-auto w-full max-w-3xl px-3 py-4 sm:px-6 md:px-8">
			<div className="mb-4">
				<Link
					to="/"
					className="text-sm text-muted-foreground hover:text-foreground"
				>
					← Back to Home
				</Link>
			</div>

			<Card className="overflow-hidden">
				<CardHeader>
					<CardTitle className="text-xl">{post.author}</CardTitle>
				</CardHeader>

				<CardContent className="flex flex-col gap-4">
					{post.imageUrl && (
						<img
							src={post.imageUrl}
							alt={`${post.author}'s post`}
							loading="lazy"
							className="w-full rounded-lg object-cover"
						/>
					)}

					<p className="whitespace-pre-wrap break-words text-base leading-relaxed">
						{post.text || "No text available"}
					</p>

					<p className="text-xs text-muted-foreground">
						{new Date(post.timestamp).toLocaleString()}
					</p>

					<div className="flex flex-wrap items-center gap-3 border-t pt-4">
						<Badge variant="secondary">❤️ {post.likes} Likes</Badge>

						<Badge variant="secondary">
							💬 {post.comments.length} Comments
						</Badge>
					</div>

					{post.comments.length > 0 && (
						<div className="border-t pt-4 space-y-2">
							<h3 className="text-sm font-semibold">Comments:</h3>
							<div className="space-y-2">
								{post.comments.map((comment) => (
									<div
										key={comment}
										className="rounded-lg bg-muted p-3 text-sm text-foreground"
									>
										{comment}
									</div>
								))}
							</div>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
