import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { seedIfEmpty } from "./seed";
import Database from "better-sqlite3";

const dbPath = resolve(process.cwd(), "database", "social-app.db");
mkdirSync(dirname(dbPath), { recursive: true });

const db = new Database(dbPath);
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT UNIQUE,
    password_hash TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  author TEXT NOT NULL,
  text TEXT NOT NULL DEFAULT '',
  image_url TEXT,
  created_at TEXT NOT NULL
);

  
`);
const LIKES_BODY = `(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL,
  user_id TEXT NOT NULL,
  UNIQUE (post_id, user_id),
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
)`;

const COMMENTS_BODY = `(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL,
  user_id TEXT NOT NULL,
  comment TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
)`;

function ensureTable(
	name: "likes" | "comments",
	body: string,
	copyColumns: string,
	copySelect: string,
	copyWhere: string,
) {
	const exists = db
		.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?")
		.get(name);

	if (!exists) {
		db.exec(`CREATE TABLE ${name} ${body}`);
		return;
	}

	const alreadyHasRule = db.pragma(`foreign_key_list(${name})`) as unknown[];
	if (alreadyHasRule.length > 0) return;

	db.transaction(() => {
		db.exec(`ALTER TABLE ${name} RENAME TO ${name}_old`);
		db.exec(`CREATE TABLE ${name} ${body}`);
		db.exec(`
      INSERT INTO ${name} (${copyColumns})
      SELECT ${copySelect} FROM ${name}_old
      WHERE ${copyWhere}
    `);
		db.exec(`DROP TABLE ${name}_old`);
	})();
}
ensureTable(
	"likes",
	LIKES_BODY,
	"id, post_id, user_id",
	"id, post_id, user_id",
	"post_id IN (SELECT id FROM posts) AND user_id IS NOT NULL",
);

ensureTable(
	"comments",
	COMMENTS_BODY,
	"id, post_id, user_id, comment, created_at",
	"id, post_id, user_id, comment, COALESCE(created_at, CURRENT_TIMESTAMP)",
	"post_id IN (SELECT id FROM posts) AND user_id IS NOT NULL AND comment IS NOT NULL",
);

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_posts_created ON posts (created_at DESC, id DESC);
  CREATE INDEX IF NOT EXISTS idx_comments_post ON comments (post_id);
`);

seedIfEmpty(db);
export default db;
