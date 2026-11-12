import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import PostCard from "../components/PostCard";
import { getPostsServerFn } from "../server/post.function";
import { getSessionServerFn } from "../server/session.function";



export const Route = createFileRoute("/")({
	loader: async () => {
	const session = await getSessionServerFn();
const feed = await getPostsServerFn({
	data: {},
});

	return { feed, user: session };
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


const loadMorePosts = async () => {
	if (!cursor) return;

	try {
		setIsLoading(true);
		setError("");

		const next = await getPostsServerFn({
			data: {
				cursor,
			},
		});

		setFeedPosts((currentPosts) => [...currentPosts, ...next.posts]);
		setCursor(next.nextCursor);
	} catch {
		setError("Posts load nahi ho sakin. Please try again.");
	} finally {
		setIsLoading(false);
	}
};
	

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
				<button
					type="button"
					onClick={loadMorePosts}
					disabled={isLoading}
					className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
				>
					{isLoading ? "Loading..." : "Load More"}
				</button>
			)}
		</div>
	);
}
