import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import PostCard from "../components/PostCard";
import { getPosts } from "../data/postService";

export const Route = createFileRoute("/")({
	component: SocialFeed,
});

function SocialFeed() {
	const [feedPosts] = useState(getPosts());

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
					<PostCard key={post.id} post={post} currentUser="Areena" />
				))
			)}
		</div>
	);
}
