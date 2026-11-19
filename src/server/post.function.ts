import { createServerFn } from "@tanstack/react-start";
import { getSessionServerFn } from "./session.function";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

import {
  and,
  desc,
  ilike,
  sql,
  lt,
  or,
  eq,
  asc,
} from "drizzle-orm";

import {
  posts,
  likes,
  comments,
} from "./database/schema";

import pgDb from "./database/postgres-db";

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

    let decoded: { createdAt: string; id: number } | null = null;
    if (data.cursor) {
      try {
        const parsed = JSON.parse(
          Buffer.from(data.cursor, "base64url").toString("utf8"),
        );
        if (
          !parsed ||
          typeof parsed !== "object" ||
          typeof parsed.createdAt !== "string" ||
          typeof parsed.id !== "number" ||
          !Number.isInteger(parsed.id)
        ) {
          throw new Error("Invalid cursor");
        }
        decoded = { createdAt: parsed.createdAt, id: parsed.id };
      } catch {
        throw new Error("Invalid cursor");
      }
    }

    const conditions = [
      or(
        ilike(posts.text, search),
        ilike(posts.author, search),
      ),
    ];

    if (decoded) {
      const cursorCondition = or(
        lt(posts.createdAt, decoded.createdAt),
        and(
          eq(posts.createdAt, decoded.createdAt),
          lt(posts.id, decoded.id),
        ),
      );
      if (cursorCondition) {
        conditions.push(cursorCondition);
      }
    }

    const rows = await pgDb
      .select({
        id: posts.id,
        author: posts.author,
        authorId: posts.authorId,
        text: posts.text,
        imageUrl: posts.imageUrl,
        createdAt: posts.createdAt,
        likes: sql<number>`(
          SELECT COUNT(*)::int
          FROM ${likes}
          WHERE ${likes.postId} = ${posts.id}
        )`,
        commentCount: sql<number>`(
          SELECT COUNT(*)::int
          FROM ${comments}
          WHERE ${comments.postId} = ${posts.id}
        )`,
        likedByMe: sql<number>`(
          SELECT COUNT(*)::int
          FROM ${likes}
          WHERE ${likes.postId} = ${posts.id}
          AND ${likes.userId} = ${session?.id ?? ""}
        )`,
      })
      .from(posts)
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
        id: row.id,
        author: row.author,
        authorId: row.authorId,
        text: row.text,
        imageUrl: row.imageUrl ?? undefined,
        timestamp: row.createdAt,
        likes: row.likes,
        comments: new Array(row.commentCount).fill(""),
        isLiked: row.likedByMe > 0,
      })),
      hasMore,
      nextCursor:
        hasMore && last
          ? Buffer.from(
              JSON.stringify({
                createdAt: last.createdAt,
                id: last.id,
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

  const isValidExternalUrl =
    /^https?:\/\/\S+$/i.test(trimmedImageUrl);

  const isValidLocalUpload =
    /^\/uploads\/[a-zA-Z0-9-]+\.(jpg|jpeg|png|webp)$/i.test(
      trimmedImageUrl,
    );

  if (
    trimmedImageUrl &&
    !isValidExternalUrl &&
    !isValidLocalUpload
  ) {
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

  const createdAt = new Date().toISOString();

  const [newPost] = await pgDb
    .insert(posts)
    .values({
      author: session.name,
      authorId: session.id,
      text: data.text,
      imageUrl: data.imageUrl || null,
      createdAt,
    })
    .returning();

  return {
    id: newPost.id,
    author: newPost.author,
    authorId: newPost.authorId,
    text: newPost.text,
    imageUrl: newPost.imageUrl ?? undefined,
    timestamp: newPost.createdAt,
    likes: 0,
    comments: [],
  };
});



export const toggleLikeServerFn = createServerFn({
  method: "POST",
})
  .validator((data: { postId: number }) => {
    if (!Number.isInteger(data.postId)) {
      throw new Error("Invalid post ID");
    }

    return data;
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

    const userId = session.id;


    const [existingLike] = await pgDb
      .select({ id: likes.id })
      .from(likes)
      .where(
        and(
          eq(likes.postId, post.id),
          eq(likes.userId, userId),
        ),
      )
      .limit(1);

    let isLiked = false;

    if (existingLike) {
      await pgDb
        .delete(likes)
        .where(eq(likes.id, existingLike.id));
      isLiked = false;
    } else {
      await pgDb
        .insert(likes)
        .values({
          postId: post.id,
          userId,
        })
        .onConflictDoNothing();
      isLiked = true;
    }

    const [countRow] = await pgDb
      .select({
        count: sql<number>`count(*)::int`,
      })
      .from(likes)
      .where(eq(likes.postId, post.id));

    return {
      postId: post.id,
      likes: countRow?.count ?? 0,
      isLiked,
    };
  });


export const createCommentServerFn = createServerFn({
  method: "POST",
})
  .validator((data: { postId: number; comment: string }) => {
    if (!Number.isInteger(data.postId)) {
      throw new Error("Invalid post ID");
    }

    const trimmed = data.comment.trim();

    if (!trimmed) {
      throw new Error("Comment cannot be empty");
    }

    if (trimmed.length > 300) {
      throw new Error("Comment cannot exceed 300 characters");
    }

    return {
      postId: data.postId,
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

    
    const [newComment] = await pgDb
      .insert(comments)
      .values({
        postId: data.postId,
        userId: session.name,
        authorId: session.id,
        comment: data.comment,
      })
      .returning();

    if (!newComment) {
      throw new Error("Comment could not be created");
    }

    return {
      id: newComment.id,
      post_id: newComment.postId,
      user_id: newComment.userId,
      comment: newComment.comment,
      created_at: newComment.createdAt,
    };
  });

export const getPostByIdServerFn = createServerFn({
  method: "GET",
})
  .validator((data: { postId: number }) => {
    if (!Number.isInteger(data.postId)) {
      throw new Error("Invalid post ID");
    }

    return data;
  })
  .handler(async ({ data }) => {
    const session = await getSessionServerFn();

    const [post] = await pgDb
      .select({
        id: posts.id,
        author: posts.author,
        authorId: posts.authorId,
        text: posts.text,
        imageUrl: posts.imageUrl,
        createdAt: posts.createdAt,
        likes: sql<number>`(
          SELECT COUNT(*)::int
          FROM ${likes}
          WHERE ${likes.postId} = ${posts.id}
        )`,
        likedByMe: sql<number>`(
          SELECT COUNT(*)::int
          FROM ${likes}
          WHERE ${likes.postId} = ${posts.id}
          AND ${likes.userId} = ${session?.id ?? ""}
        )`,
      })
      .from(posts)
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
        comment: comments.comment,
        created_at: comments.createdAt,
      })
      .from(comments)
      .where(eq(comments.postId, data.postId))
      .orderBy(asc(comments.createdAt), asc(comments.id));

    return {
      id: post.id,
      author: post.author,
      authorId: post.authorId,
      text: post.text,
      imageUrl: post.imageUrl ?? undefined,
      timestamp: post.createdAt,
      likes: post.likes,
      comments: commentRows,
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

    const uploadDirectory = path.join(
      process.cwd(),
      "public",
      "uploads",
    );

    await mkdir(uploadDirectory, { recursive: true });

    await writeFile(
      path.join(uploadDirectory, filename),
      buffer,
    );

    return {
      imageUrl: `/uploads/${filename}`,
    };
  });