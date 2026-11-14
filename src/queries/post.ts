import { queryOptions } from "@tanstack/react-query";
import { getPostByIdServerFn } from "#/server/post.function";

export const postKeys = {
    all: ["posts"] as const,
    detail: (id: number) => [...postKeys.all, "detail", id] as const,
};

export const postDetailQueryOptions = (postId: number) =>
    queryOptions({
        queryKey: postKeys.detail(postId),
        queryFn: () => getPostByIdServerFn({ data: { postId } }),
    });