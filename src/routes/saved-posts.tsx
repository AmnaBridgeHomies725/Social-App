import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import PostCard from "../components/PostCard";
import { savedPostsQueryOptions } from "../queries/post";

export const Route = createFileRoute("/saved-posts")({
	loader: ({ context }) =>
		context.queryClient.ensureQueryData(savedPostsQueryOptions()),
	component: SavedPostsPage,
});

function SavedPostsPage() {
	const { data: posts } = useSuspenseQuery(savedPostsQueryOptions());

	return (
		<div className="social-feed-shell">
			<header className="mb-2">
				<h1 className="text-3xl font-bold tracking-tight text-foreground">
					Saved Posts
				</h1>
				<p className="mt-2 text-muted-foreground">
					Posts you saved are collected here.
				</p>
			</header>

			{posts.length === 0 ? (
				<Card>
					<CardContent className="p-8 text-center text-muted-foreground">
						You haven&apos;t saved any posts yet. Use the Save button on a post
						to keep it here.
					</CardContent>
				</Card>
			) : (
				posts.map((post) => <PostCard key={post.id} post={post} />)
			)}
		</div>
	);
}
