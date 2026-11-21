import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { createServerFn } from "@tanstack/react-start";
import { and, eq, sql } from "drizzle-orm";
import pgDb from "./database/postgres-db";
import { profiles, uploads, user } from "./database/schema";
import { getSessionServerFn } from "./session.function";
import { detectImageType, getUploadDir, UPLOAD_PATH_REGEX } from "./uploads";
import { isValidUsername } from "../lib/validation";

export const getMyProfileServerFn = createServerFn({ method: "GET" }).handler(
	async () => {
		const session = await getSessionServerFn();
		if (!session) throw new Error("Unauthorized");

		const [userRow] = await pgDb
			.select({
				name: user.name,
				profileUsername: profiles.username,
				bio: profiles.bio,
				imageUrl: profiles.imageUrl,
			})
			.from(user)
			.leftJoin(profiles, eq(user.id, profiles.userId))
			.where(eq(user.id, session.id))
			.limit(1);

		if (!userRow) throw new Error("User not found");

		return {
			username:
				userRow.profileUsername ??
				userRow.name.toLowerCase().replace(/\s+/g, "_"),
			bio: userRow.bio ?? "",
			imageUrl: userRow.imageUrl ?? "",
		};
	},
);

export const saveMyProfileServerFn = createServerFn({ method: "POST" })
	.validator((data: { username: string; bio: string; imageUrl: string }) => {
		const username = data.username.trim();
		const bio = data.bio.trim();

		if (!isValidUsername(username)) {
			throw new Error(
				"Username must be 3–20 characters and use only letters, numbers, underscores, or periods.",
			);
		}
		if (bio.length > 160)
			throw new Error("Bio must be 160 characters or fewer.");
		if (
			data.imageUrl &&
			!UPLOAD_PATH_REGEX.test(data.imageUrl)
		) {
			throw new Error("Profile image path is invalid.");
		}

		return { username, bio, imageUrl: data.imageUrl || null };
	})
	.handler(async ({ data }) => {
		const session = await getSessionServerFn();
		if (!session) throw new Error("Unauthorized");
		const [oldProfile] = await pgDb.select({ imageUrl: profiles.imageUrl }).from(profiles).where(eq(profiles.userId, session.id)).limit(1);
		let savedProfile: typeof profiles.$inferSelect | undefined;
		try {
		const [existingUsername] = await pgDb
			.select({ userId: profiles.userId })
			.from(profiles)
			.where(sql`lower(${profiles.username}) = ${data.username.toLowerCase()}`)
			.limit(1);
		if (existingUsername && existingUsername.userId !== session.id) {
			throw new Error("This username is already taken.");
		}

		[savedProfile] = await pgDb
			.insert(profiles)
			.values({ userId: session.id, ...data })
			.onConflictDoUpdate({
				target: profiles.userId,
				set: {
					username: data.username,
					bio: data.bio,
					imageUrl: data.imageUrl,
				},
			})
			.returning();
		await pgDb
			.update(user)
			.set({ name: data.username })
			.where(eq(user.id, session.id));

		} catch (error) {
			if (data.imageUrl && data.imageUrl !== oldProfile?.imageUrl && UPLOAD_PATH_REGEX.test(data.imageUrl)) {
				const [owned] = await pgDb.select({ id: uploads.id }).from(uploads).where(and(eq(uploads.filePath, data.imageUrl), eq(uploads.userId, session.id))).limit(1);
				if (owned) {
					await unlink(path.join(getUploadDir(), path.basename(data.imageUrl))).catch(() => undefined);
					await pgDb.delete(uploads).where(eq(uploads.id, owned.id));
				}
			}
			throw error;
		}
		if (!savedProfile) throw new Error("Profile could not be saved.");
		if (oldProfile?.imageUrl && oldProfile.imageUrl !== data.imageUrl && UPLOAD_PATH_REGEX.test(oldProfile.imageUrl)) {
			try {
				const [owned] = await pgDb.select({ id: uploads.id }).from(uploads).where(and(eq(uploads.filePath, oldProfile.imageUrl), eq(uploads.userId, session.id))).limit(1);
				if (owned) {
					await unlink(path.join(getUploadDir(), path.basename(oldProfile.imageUrl))).catch(() => undefined);
					await pgDb.delete(uploads).where(eq(uploads.id, owned.id));
				}
			} catch { /* Keep the saved profile valid if cleanup is temporarily unavailable. */ }
		}
		return {
			username: savedProfile.username,
			bio: savedProfile.bio,
			imageUrl: savedProfile.imageUrl ?? "",
		};
	});

export const uploadProfileImageServerFn = createServerFn({ method: "POST" })
	.validator((data: FormData) => data)
	.handler(async ({ data }) => {
		const session = await getSessionServerFn();
		if (!session) throw new Error("Unauthorized");

		const file = data.get("image");
		if (!(file instanceof File))
			throw new Error("Please select a profile photo.");
		const extensions: Record<string, string> = {
			"image/jpeg": ".jpg",
			"image/png": ".png",
			"image/webp": ".webp",
		};
		if (!extensions[file.type])
			throw new Error("Only JPG, PNG, and WEBP images are allowed.");
		if (file.size > 5 * 1024 * 1024)
			throw new Error("Image must be smaller than 5 MB.");

		const buffer = Buffer.from(await file.arrayBuffer());
		if (detectImageType(buffer) !== file.type) throw new Error("The image file is invalid.");

		const filename = `profile-${randomUUID()}${extensions[file.type]}`;
		const directory = getUploadDir();
		await mkdir(directory, { recursive: true });
		await writeFile(path.join(directory, filename), buffer);
		try {
			await pgDb.insert(uploads).values({ userId: session.id, filePath: `/uploads/${filename}` });
		} catch (error) {
			await unlink(path.join(directory, filename)).catch(() => undefined);
			throw error;
		}
		return { imageUrl: `/uploads/${filename}` };
	});
