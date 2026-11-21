import "dotenv/config";
import { randomUUID } from "node:crypto";
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL ?? "", { max: 1 });
const marker = `timestamp-check-${randomUUID()}`;

try {
	await sql.begin(async (transaction) => {
		const [oldPost] = await transaction<{ id: number }[]>`
			INSERT INTO posts (text, created_at) VALUES (${`${marker}-old`}, ${new Date("2000-01-01T00:00:00Z")}) RETURNING id
		`;
		const [newPost] = await transaction<{ id: number }[]>`
			INSERT INTO posts (text, created_at) VALUES (${`${marker}-new`}, ${new Date()}) RETURNING id
		`;
		const rows = await transaction<{ text: string; created_at: Date }[]>`
			SELECT text, created_at FROM posts WHERE text IN (${`${marker}-old`}, ${`${marker}-new`}) ORDER BY created_at ASC
		`;
		if (rows.length !== 2 || rows[0]?.text !== `${marker}-old` || !oldPost || !newPost) {
			throw new Error("Post timestamps did not sort chronologically.");
		}
		await transaction`DELETE FROM posts WHERE text LIKE ${`${marker}-%`}`;
		console.log("Timestamp ordering passed.");
	});
} finally {
	await sql.end();
}
