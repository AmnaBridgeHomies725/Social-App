import bcrypt from "bcryptjs";
import db from "./db";
import { posts as samplePosts } from "../../data/posts";

export function seedDatabase() {
const users = [
	{ name: "Admin", email: "admin@example.com", password: "Admin@123" },
	{ name: "User One", email: "user1@example.com", password: "User@123" },
	{ name: "User Two", email: "user2@example.com", password: "User@123" },
	{ name: "User Three", email: "user3@example.com", password: "User@123" },
];

for (const user of users) {
	const passwordHash = bcrypt.hashSync(user.password, 10);

	db.prepare(
		"INSERT OR IGNORE INTO users (name, email, password_hash) VALUES (?, ?, ?)",
	).run(user.name, user.email, passwordHash);
}
const insertPost = db.prepare(
	"INSERT OR IGNORE INTO posts (id, author, text, image_url, created_at) VALUES (?, ?, ?, ?, ?)",
);
const insertLike = db.prepare(
	"INSERT OR IGNORE INTO likes (post_id, user_id) VALUES (?, ?)",
);
const insertComment = db.prepare(
	"INSERT INTO comments (post_id, user_id, comment) VALUES (?, ?, ?)",
);


db.transaction(() => {
	for (const post of samplePosts) {
		const result = insertPost.run(
			post.id,
			post.author,
			post.text,
			post.imageUrl ?? null,
			post.timestamp,
		);

		if (result.changes === 0) continue;

		for (let i = 0; i < post.likes; i++) {
			insertLike.run(post.id, `seed-user-${post.id}-${i}`);
		}

		for (const comment of post.comments ?? []) {
			insertComment.run(post.id, "Community Member", comment);
		}
	}
})();}
 
seedDatabase();