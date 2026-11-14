import { createFileRoute , useRouter} from "@tanstack/react-router";
import { useCallback, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import PostCard from "../components/PostCard";
import { getSessionServerFn } from "../server/session.function";
import { feedQueryOptions } from "../queries/post";
import { useSuspenseInfiniteQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
	loader: async ({ context }) => {
		const session = await getSessionServerFn();
		await context.queryClient.ensureInfiniteQueryData(feedQueryOptions());

		return { user: session };
	},
	pendingComponent: () => (
	<p className="p-4 text-center" aria-live="polite">
		Loading feed...
	</p>
),
errorComponent: FeedError,
	component: SocialFeed,
});

function FeedError({ error }: { error: unknown }) {
	const router = useRouter();

	return (
		<div className="p-4 text-center" role="alert">
			<p>
				{error instanceof Error
					? error.message
					: "Posts could not be loaded. Please try again."}
			</p>
			<Button type="button" onClick={() => void router.invalidate()}>
				Retry loading feed
			</Button>
		</div>
	);
}

function SocialFeed() {
	const initial = Route.useLoaderData();

	const {
		data,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
		isFetchNextPageError,
		error
	} = useSuspenseInfiniteQuery(feedQueryOptions());

	const currentUser = initial.user?.name ?? "";
	const feedPosts = data.pages.flatMap((page) => page.posts);
	const hasMore = hasNextPage;

	const sentinelRef = useRef<HTMLDivElement | null>(null);

	const loadMorePosts = useCallback(async () => {
		if (!hasNextPage || isFetchingNextPage || isFetchNextPageError) return;

		await fetchNextPage();
	}, [fetchNextPage, hasNextPage, isFetchingNextPage, isFetchNextPageError,]);

	useEffect(() => {
		const sentinel = sentinelRef.current;

		if (!sentinel || !hasMore || isFetchNextPageError) return;

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
	}, [hasMore,isFetchNextPageError, loadMorePosts]);


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
					{isFetchingNextPage && <p>Loading more posts...</p>}
					{isFetchNextPageError && (
	<div role="alert">
		<p>
			{error instanceof Error
				? error.message
				: "More posts could not be loaded."}
		</p>
		<Button
			type="button"
			variant="outline"
			onClick={() => void fetchNextPage()}
		>
			Retry loading posts
		</Button>
	</div>
)}
				</div>
			)}
			{!hasMore && feedPosts.length > 0 && (
	<p className="mt-4 text-center text-sm text-muted-foreground">
		You&apos;re all caught up.
	</p>
)}
		</div>
	);
}
