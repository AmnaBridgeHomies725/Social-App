import { createServerFn } from "@tanstack/react-start";
import bcrypt from "bcryptjs";
import db from "./database/db";

export const loginUser = createServerFn({
	method: "POST",
})
	.validator((data: { email: string; password: string }) => data)
	.handler(async ({ data }) => {
		const user = db
			.prepare("SELECT * FROM users WHERE email = ?")
			.get(data.email) as
			| { id: number; name: string; email: string; password_hash: string }
			| undefined;

		if (!user) {
			throw new Error("Invalid email or password");
		}

		const isPasswordCorrect = bcrypt.compareSync(
			data.password,
			user.password_hash,
		);

		if (!isPasswordCorrect) {
			throw new Error("Invalid email or password");
		}

		return {
			user: {
				id: user.id,
				name: user.name,
				email: user.email,
			},
		};
	});
