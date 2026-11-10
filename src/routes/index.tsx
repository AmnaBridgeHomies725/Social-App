import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import PostCard from "../components/PostCard";
import { getPostsServerFn } from "../server/post.function";

const PAGE_SIZE = 2;

export const Route = createFileRoute("/")({
	loader: async () => {
		return await getPostsServerFn({
			data: {
				pageSize: PAGE_SIZE,
				offset: 0,
			},
		});
	},
	component: SocialFeed,
});

function SocialFeed() {
	const initialPosts = Route.useLoaderData();

	const [currentUser, setCurrentUser] = useState("Areena");
	const [feedPosts, setFeedPosts] = useState(initialPosts);
	const [offset, setOffset] = useState(initialPosts.length);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState("");
	const [hasMore, setHasMore] = useState(initialPosts.length === PAGE_SIZE);

	useEffect(() => {
		const stored = localStorage.getItem("user");
		if (stored) {
			try {
				const u = JSON.parse(stored);
				if (u.name) setCurrentUser(u.name);
			} catch {}
		}
	}, []);

	const loadMorePosts = async () => {
		try {
			setIsLoading(true);
			setError("");

			const nextPosts = await getPostsServerFn({
				data: {
					pageSize: PAGE_SIZE,
					offset: offset,
				},
			});

			setFeedPosts((currentPosts) => [...currentPosts, ...nextPosts]);

			setOffset((currentOffset) => currentOffset + nextPosts.length);

			if (nextPosts.length < PAGE_SIZE) {
				setHasMore(false);
			}
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
