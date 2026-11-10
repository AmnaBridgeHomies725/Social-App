import bcrypt from "bcryptjs";
import db from "./db";

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
