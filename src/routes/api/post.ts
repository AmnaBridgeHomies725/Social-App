import { createFileRoute } from "@tanstack/react-router";
import { posts } from "../../data/posts";

export const Route = createFileRoute("/api/post")({
	server: {
		handlers: {
			GET: async () => {
				return Response.json({ posts });
			},

			POST: async ({ request }) => {
				const body = await request.json().catch(() => null);

				if (!body) {
					return Response.json(
						{ message: "Invalid request body." },
						{ status: 400 },
					);
				}

				const text = String(body.text || "").trim();
				const imageUrl = String(body.imageUrl || "").trim();

				if (!text && !imageUrl) {
					return Response.json(
						{
							message:
								"Text ya Image URL me se koi ek cheez likhna zaroori hai.",
						},
						{ status: 400 },
					);
				}

				if (text.length > 500) {
					return Response.json(
						{ message: "Post 500 characters se zyada nahi ho sakti." },
						{ status: 400 },
					);
				}

				const newPost = {
					id: Date.now(),
					author: "Areena",
					text,
					imageUrl,
					timestamp: new Date().toISOString(),
					likes: 0,
					comments: [],
				};

				return Response.json(
					{
						message: "Post successfully create ho gaya!",
						post: newPost,
					},
					{ status: 201 },
				);
			},
		},
	},
});
