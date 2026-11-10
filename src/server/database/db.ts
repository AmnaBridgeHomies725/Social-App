import { resolve } from "node:path";
import Database from "better-sqlite3";

const db = new Database(resolve("database/social-app.db"));

export default db;
