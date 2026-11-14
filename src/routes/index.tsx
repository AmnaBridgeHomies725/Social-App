import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import PostCard from "../components/PostCard";
import { getPostsServerFn } from "../server/post.function";
import { getSessionServerFn } from "../server/session.function";
import { Button } from "@/components/ui/button";
import { feedQueryOptions } from "../queries/post";

export const Route = createFileRoute("/")({
	loader: async ({ context }) => {
		const session = await getSessionServerFn();
		const feed = await context.queryClient.ensureInfiniteQueryData(
			feedQueryOptions(),
		);

		return { feed: feed.pages[0], user: session };
	},
	component: SocialFeed,
});

function SocialFeed() {
	const initial = Route.useLoaderData();

	const currentUser = initial.user?.name ?? "";

	const [feedPosts, setFeedPosts] = useState(initial.feed.posts);
	const [cursor, setCursor] = useState<string | null>(initial.feed.nextCursor);
	const hasMore = cursor !== null;
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState("");

	const sentinelRef = useRef<HTMLDivElement | null>(null);
const loadingRef = useRef(false);

	const loadMorePosts = useCallback(async () => {
		if (!cursor || loadingRef.current) return;

		loadingRef.current = true;
	setIsLoading(true);
	setError("");

		try {
			

			const next = await getPostsServerFn({
				data: {
					cursor,
				},
			});

			setFeedPosts((currentPosts) => [...currentPosts, ...next.posts]);
			setCursor(next.nextCursor);
		} catch {
			setError("Posts could not be loaded. Please try again.");
		} finally {
			loadingRef.current = false;
			setIsLoading(false);
			
		}
	}, [cursor]);

	useEffect(() => {
	const sentinel = sentinelRef.current;

	if (!sentinel || !hasMore) return;

	const observer = new IntersectionObserver(
		(entries) => {
			if (entries[0]?.isIntersecting) {
				void loadMorePosts();
			}
		},
		{ rootMargin: "200px 0px" },
	);

	observer.observe(sentinel);

	return () => observer.disconnect();
}, [hasMore, loadMorePosts]);


	return (
		<div className="social-feed-shell">
			<header className="mb-2">
				<h1 className="text-3xl font-bold tracking-tight text-foreground">
					Home Feed
				</h1>

				<p className="mt-2 text-muted-foreground">
					See what's happening in your community.
				</p>
			</header>

			{error && <p className="mb-4 text-red-500">{error}</p>}

			{feedPosts.length === 0 ? (
				<Card>
					<CardContent className="p-8 text-center text-muted-foreground">
						No posts available.
					</CardContent>
				</Card>
			) : (
				feedPosts.map((post) => (
					<PostCard key={post.id} post={post} currentUser={currentUser} />
				))
			)}

{hasMore && (
	<div
		ref={sentinelRef}
		className="mt-4 min-h-10 text-center text-sm text-muted-foreground"
		aria-live="polite"
	>
		{isLoading && <p>Loading more posts...</p>}

		{error && (
			<Button
				type="button"
				variant="outline"
				onClick={() => void loadMorePosts()}
				disabled={isLoading}
			>
				Retry loading posts
			</Button>
		)}
	</div>
)}
		</div>
	);
}
