import { betterAuth } from "better-auth";
import Database from "better-sqlite3";
import { resolve } from "node:path";

export const auth = betterAuth({
  database: new Database(resolve(process.cwd(), "database", "social-app.db")),
  emailAndPassword: {
    enabled: true,
  },
});