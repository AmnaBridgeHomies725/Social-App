import { createServerFn } from "@tanstack/react-start";
import { getSessionServerFn } from "./session.function";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

import { and, desc, ilike, sql, lt, or, eq, asc } from "drizzle-orm";

import { posts, likes, comments, user } from "./database/schema";

import pgDb from "./database/postgres-db";

function parsePostId(value: unknown): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("Invalid post ID");
  }
  return id;
}

export const getPostsServerFn = createServerFn({
  method: "GET",
})
  .validator(
    (data: { pageSize?: number; cursor?: string; search?: string }) => ({
      pageSize: Math.min(Math.max(data.pageSize ?? 2, 1), 50),
      cursor: data.cursor,
      search: data.search,
    }),
  )
  .handler(async ({ data }) => {
    const session = await getSessionServerFn();
    const escapedSearch = (data.search?.trim() ?? "").replace(/[\\%_]/g, "\\$&");
    const search = `%${escapedSearch}%`;

    let decoded: { createdAt: string; id: string } | null = null;
    if (data.cursor) {
      try {
        const parsed = JSON.parse(
          Buffer.from(data.cursor, "base64url").toString("utf8"),
        );
        if (
          !parsed ||
          typeof parsed !== "object" ||
          !parsed.createdAt ||
          parsed.id === undefined ||
          parsed.id === null
        ) {
          throw new Error("Invalid cursor");
        }
        decoded = { createdAt: String(parsed.createdAt), id: String(parsed.id) };
      } catch {
        throw new Error("Invalid cursor");
      }
    }

    const conditions = [
      or(ilike(posts.text, search), ilike(user.name, search)),
    ];

    if (decoded) {
      const cursorCondition = or(
        lt(posts.createdAt, decoded.createdAt),
        and(
          eq(posts.createdAt, decoded.createdAt),
          lt(posts.id, Number(decoded.id)),
        ),
      );
      if (cursorCondition) {
        conditions.push(cursorCondition);
      }
    }

    const rows = await pgDb
      .select({
        id: posts.id,
        userId: posts.userId,
        userName: user.name,
        text: posts.text,
        imageUrl: posts.imageUrl,
        createdAt: posts.createdAt,
        likes: sql<number>`(
          SELECT COUNT(*)::int FROM "likes" WHERE "likes"."post_id" = "posts"."id"
        )`,
        commentCount: sql<number>`(
          SELECT COUNT(*)::int FROM "comments" WHERE "comments"."post_id" = "posts"."id"
        )`,
        likedByMe: session
          ? sql<number>`(
              SELECT COUNT(*)::int FROM "likes"
              WHERE "likes"."post_id" = "posts"."id"
              AND "likes"."user_id" = ${session.id}
            )`
          : sql<number>`0`,
      })
      .from(posts)
      .leftJoin(user, eq(posts.userId, user.id))
      .where(and(...conditions))
      .orderBy(desc(posts.createdAt), desc(posts.id))
      .limit(data.pageSize + 1);

    const hasMore = rows.length > data.pageSize;
    const pageRows = hasMore
      ? rows.slice(0, data.pageSize)
      : rows;

    const last = pageRows[pageRows.length - 1];

    return {
      posts: pageRows.map((row) => ({
        id: String(row.id),
        userName: row.userName ?? "Unknown",
        userId: row.userId ?? undefined,
        text: row.text,
        imageUrl: row.imageUrl ?? undefined,
        timestamp: String(row.createdAt),
        likes: row.likes,
        commentCount: row.commentCount,
        isLiked: row.likedByMe > 0,
      })),
      hasMore,
      nextCursor:
        hasMore && last
          ? Buffer.from(
              JSON.stringify({
                createdAt: String(last.createdAt),
                id: String(last.id),
              }),
            ).toString("base64url")
          : null,
    };
  });

export const createPostServerFn = createServerFn({
  method: "POST",
})
  .validator((data: { text: string; imageUrl: string }) => {
    const trimmedText = data.text.trim();
    const trimmedImageUrl = data.imageUrl.trim();

    if (!trimmedText) {
      throw new Error("Post text cannot be empty.");
    }

    if (trimmedText.length > 500) {
      throw new Error("Post cannot exceed 500 characters.");
    }

    const isValidExternalUrl = /^https?:\/\/\S+$/i.test(trimmedImageUrl);
    const isValidLocalUpload =
      /^\/uploads\/[a-zA-Z0-9-]+\.(jpg|jpeg|png|webp)$/i.test(trimmedImageUrl);

    if (trimmedImageUrl && !isValidExternalUrl && !isValidLocalUpload) {
      throw new Error("Please enter a valid image URL.");
    }

    return {
      text: trimmedText,
      imageUrl: trimmedImageUrl,
    };
  })
  .handler(async ({ data }) => {
    const session = await getSessionServerFn();

    if (!session) {
      throw new Error("Unauthorized");
    }

    const now = new Date().toISOString();
    const [newPost] = await pgDb
      .insert(posts)
      .values({
        userId: session.id,
        text: data.text,
        imageUrl: data.imageUrl || null,
        createdAt: now,
      })
      .returning();

    return {
      id: String(newPost.id),
      userName: session.name,
      userId: newPost.userId ?? undefined,
      text: newPost.text,
      imageUrl: newPost.imageUrl ?? undefined,
      timestamp: String(newPost.createdAt),
      likes: 0,
      commentCount: 0,
      isLiked: false,
      comments: [],
    };
  });

export const toggleLikeServerFn = createServerFn({
  method: "POST",
})
  .validator((data: { postId: string | number }) => ({
    postId: parsePostId(data.postId),
  }))
  .handler(async ({ data }) => {
    const session = await getSessionServerFn();

    if (!session) {
      throw new Error("Unauthorized");
    }

    const [post] = await pgDb
      .select({ id: posts.id })
      .from(posts)
      .where(eq(posts.id, data.postId))
      .limit(1);

    if (!post) {
      throw new Error("Post not found");
    }

    const removed = await pgDb
      .delete(likes)
      .where(and(eq(likes.postId, post.id), eq(likes.userId, session.id)))
      .returning({ postId: likes.postId });

    let isLiked: boolean;

    if (removed.length > 0) {
      isLiked = false;
    } else {
      await pgDb
        .insert(likes)
        .values({ postId: post.id, userId: session.id });
      isLiked = true;
    }

    const [countRow] = await pgDb
      .select({
        count: sql<number>`count(*)::int`,
      })
      .from(likes)
      .where(eq(likes.postId, post.id));

    return {
      postId: String(post.id),
      likes: countRow?.count ?? 0,
      isLiked,
    };
  });

export const createCommentServerFn = createServerFn({
  method: "POST",
})
  .validator((data: { postId: string | number; comment: string }) => {
    const postId = parsePostId(data.postId);
    const trimmed = data.comment.trim();

    if (!trimmed) {
      throw new Error("Comment cannot be empty");
    }

    if (trimmed.length > 300) {
      throw new Error("Comment cannot exceed 300 characters");
    }

    return {
      postId,
      comment: trimmed,
    };
  })
  .handler(async ({ data }) => {
    const session = await getSessionServerFn();

    if (!session) {
      throw new Error("Unauthorized");
    }

    const [post] = await pgDb
      .select({ id: posts.id })
      .from(posts)
      .where(eq(posts.id, data.postId))
      .limit(1);

    if (!post) {
      throw new Error("Post not found");
    }

    const now = new Date().toISOString();
    const [newComment] = await pgDb
      .insert(comments)
      .values({
        postId: data.postId,
        userId: session.id,
        comment: data.comment,
        createdAt: now,
      })
      .returning();

    if (!newComment) {
      throw new Error("Comment could not be created");
    }

    return {
      id: String(newComment.id),
      post_id: String(newComment.postId),
      user_id: String(newComment.userId ?? ""),
      user_name: session.name,
      comment: newComment.comment,
      created_at: String(newComment.createdAt),
    };
  });

export const getPostByIdServerFn = createServerFn({
  method: "GET",
})
  .validator((data: { postId: string | number }) => ({
    postId: parsePostId(data.postId),
  }))
  .handler(async ({ data }) => {
    const session = await getSessionServerFn();

    const [post] = await pgDb
      .select({
        id: posts.id,
        userName: user.name,
        userId: posts.userId,
        text: posts.text,
        imageUrl: posts.imageUrl,
        createdAt: posts.createdAt,
        likes: sql<number>`(
          SELECT COUNT(*)::int
          FROM "likes"
          WHERE "likes"."post_id" = "posts"."id"
        )`,
        likedByMe: session
          ? sql<number>`(
              SELECT COUNT(*)::int
              FROM "likes"
              WHERE "likes"."post_id" = "posts"."id"
              AND "likes"."user_id" = ${session.id}
            )`
          : sql<number>`0`,
      })
      .from(posts)
      .leftJoin(user, eq(posts.userId, user.id))
      .where(eq(posts.id, data.postId))
      .limit(1);

    if (!post) {
      return null;
    }

    const commentRows = await pgDb
      .select({
        id: comments.id,
        post_id: comments.postId,
        user_id: comments.userId,
        user_name: user.name,
        comment: comments.comment,
        created_at: comments.createdAt,
      })
      .from(comments)
      .leftJoin(user, eq(comments.userId, user.id))
      .where(eq(comments.postId, data.postId))
      .orderBy(asc(comments.createdAt), asc(comments.id));

    return {
      id: String(post.id),
      userName: post.userName ?? "Unknown",
      userId: post.userId ?? undefined,
      text: post.text,
      imageUrl: post.imageUrl ?? undefined,
      timestamp: String(post.createdAt),
      likes: post.likes,
      comments: commentRows.map((c) => ({
        id: String(c.id),
        post_id: String(c.post_id),
        user_id: String(c.user_id ?? ""),
        user_name: c.user_name ?? "Unknown",
        comment: c.comment,
        created_at: String(c.created_at),
      })),
      isLiked: post.likedByMe > 0,
    };
  });

export const uploadImageServerFn = createServerFn({
  method: "POST",
})
  .validator((data: FormData) => data)
  .handler(async ({ data }) => {
    const session = await getSessionServerFn();

    if (!session) {
      throw new Error("Unauthorized");
    }

    const file = data.get("image");

    if (!(file instanceof File)) {
      throw new Error("No image file provided.");
    }

    const allowedTypes: Record<string, string> = {
      "image/jpeg": ".jpg",
      "image/png": ".png",
      "image/webp": ".webp",
    };

    if (!allowedTypes[file.type]) {
      throw new Error("Only JPG, PNG, and WEBP images are allowed.");
    }

    if (file.size > 5 * 1024 * 1024) {
      throw new Error("Image size must be less than 5 MB.");
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const isJpeg =
      buffer.length >= 3 &&
      buffer[0] === 0xff &&
      buffer[1] === 0xd8 &&
      buffer[2] === 0xff;

    const isPng =
      buffer.length >= 8 &&
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a;

    const isWebp =
      buffer.length >= 12 &&
      buffer[0] === 0x52 &&
      buffer[1] === 0x49 &&
      buffer[2] === 0x46 &&
      buffer[3] === 0x46 &&
      buffer[8] === 0x57 &&
      buffer[9] === 0x45 &&
      buffer[10] === 0x42 &&
      buffer[11] === 0x50;

    const isValidMagic =
      (file.type === "image/jpeg" && isJpeg) ||
      (file.type === "image/png" && isPng) ||
      (file.type === "image/webp" && isWebp);

    if (!isValidMagic) {
      throw new Error("Invalid image file format.");
    }

    const filename = `${randomUUID()}${allowedTypes[file.type]}`;

    const uploadDirectory = path.join(process.cwd(), "public", "uploads");

    await mkdir(uploadDirectory, { recursive: true });

    await writeFile(path.join(uploadDirectory, filename), buffer);

    return {
      imageUrl: `/uploads/${filename}`,
    };
  });

export const deleteUploadedImageServerFn = createServerFn({
  method: "POST",
})
  .validator((data: { imageUrl: string }) => {
    if (typeof data.imageUrl !== "string") {
      throw new Error("Invalid image URL");
    }
    return data;
  })
  .handler(async ({ data }) => {
    const session = await getSessionServerFn();

    if (!session) {
      throw new Error("Unauthorized");
    }

    const uuidPattern =
      /^\/uploads\/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\.(jpg|jpeg|png|webp)$/i;

    if (!uuidPattern.test(data.imageUrl)) {
      throw new Error("Invalid file path");
    }

    const filename = path.basename(data.imageUrl);
    const targetPath = path.join(process.cwd(), "public", "uploads", filename);

    try {
      await unlink(targetPath);
    } catch {
      // Ignore if file doesn't exist
    }

    return { success: true };
  });
