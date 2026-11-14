import { infiniteQueryOptions,queryOptions } from "@tanstack/react-query";
import { getPostByIdServerFn, getPostsServerFn } from "#/server/post.function";

export const postKeys = {
    all: ["posts"] as const,
    feed: () => [...postKeys.all, "feed"] as const,
    detail: (id: number) => [...postKeys.all, "detail", id] as const,
};

export const feedQueryOptions = () =>
	infiniteQueryOptions({
		queryKey: postKeys.feed(),
		queryFn: ({ pageParam }) =>
			getPostsServerFn({ data: { cursor: pageParam } }),
		initialPageParam: undefined as string | undefined,
		getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
	});
    
export const postDetailQueryOptions = (postId: number) =>
    queryOptions({
        queryKey: postKeys.detail(postId),
        queryFn: () => getPostByIdServerFn({ data: { postId } }),
    });