import type Database from "better-sqlite3";
import { posts as samplePosts } from "../../data/posts";

export function seedIfEmpty(db: Database.Database) {
	const row = db.prepare("SELECT COUNT(*) AS count FROM posts").get() as {
		count: number;
	};

	if (row.count > 0) return;

	const insertPost = db.prepare(
		"INSERT INTO posts (author, text, image_url, created_at) VALUES (?, ?, ?, ?)",
	);
	const insertComment = db.prepare(
		"INSERT INTO comments (post_id, user_id, comment) VALUES (?, ?, ?)",
	);

	const seedAll = db.transaction(() => {
		for (const post of samplePosts) {
			const result = insertPost.run(
				post.author,
				post.text,
				post.imageUrl ?? null,
				post.timestamp,
			);

			for (const comment of post.comments) {
				insertComment.run(
					Number(result.lastInsertRowid),
					"Practice User",
					comment,
				);
			}
		}
	});

	seedAll();
}