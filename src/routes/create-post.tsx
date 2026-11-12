import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createPostServerFn } from "../server/post.function";

export const Route = createFileRoute("/create-post")({
	component: CreatePost,
});

function CreatePost() {
	const navigate = useNavigate();
	const router = useRouter();

	const [text, setText] = useState("");
	const [imageUrl, setImageUrl] = useState("");
	const [error, setError] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	async function handleSubmit(event: React.FormEvent) {
		event.preventDefault();

		setError("");
		setIsLoading(true);

				try {
			await createPostServerFn({
				data: {
					text,
					imageUrl,
				},
			});

			await router.invalidate();
			navigate({ to: "/" });
		} catch (err) {
			setError(
				err instanceof Error
					? err.message
					: "Something went wrong. Please try again.",
			);
		} finally {
			setIsLoading(false);
		}
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

						<Button type="submit" disabled={isLoading}>
							{isLoading ? "Creating..." : "Create Post"}
						</Button>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
