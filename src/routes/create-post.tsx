import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createPost } from "../data/postService";

export const Route = createFileRoute("/create-post")({
	component: CreatePost,
});

function CreatePost() {
	const navigate = useNavigate();

	const [text, setText] = useState("");
	const [imageUrl, setImageUrl] = useState("");
	const [error, setError] = useState("");

	function handleSubmit(event: React.FormEvent) {
		event.preventDefault();

		const trimmedText = text.trim();
		const trimmedImageUrl = imageUrl.trim();

		if (!trimmedText && !trimmedImageUrl) {
			setError("Please enter text or an image URL.");
			return;
		}

		if (trimmedText.length > 500) {
			setError("Post text cannot exceed 500 characters.");
			return;
		}

		if (
			trimmedImageUrl &&
			!trimmedImageUrl.startsWith("http://") &&
			!trimmedImageUrl.startsWith("https://")
		) {
			setError("Please enter a valid HTTP or HTTPS image URL.");
			return;
		}

		createPost(trimmedText, trimmedImageUrl);
		navigate({ to: "/" });
	}

	return (
		<div className="mx-auto w-full max-w-2xl">
			<h1 className="mb-6 text-3xl font-bold tracking-tight">Create Post</h1>

			<Card>
				<CardHeader>
					<CardTitle>Share with your community</CardTitle>
				</CardHeader>

				<CardContent>
					<form className="flex flex-col gap-4" onSubmit={handleSubmit}>
						<Textarea
							placeholder="What's happening in your community?"
							value={text}
							maxLength={500}
							onChange={(e) => {
								setText(e.target.value);
								setError("");
							}}
						/>

						<p className="text-right text-sm text-muted-foreground">
							{text.length}/500 characters
						</p>

						<Input
							type="url"
							placeholder="Image URL (optional)"
							value={imageUrl}
							onChange={(e) => {
								setImageUrl(e.target.value);
								setError("");
							}}
						/>

						{imageUrl && (
							<img
								src={imageUrl}
								alt="Post preview"
								className="max-h-80 w-full rounded-lg object-cover"
								onError={(e) => {
									e.currentTarget.style.display = "none";
								}}
							/>
						)}

						{error && <p className="text-sm text-destructive">{error}</p>}

						<Button type="submit">Create Post</Button>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
