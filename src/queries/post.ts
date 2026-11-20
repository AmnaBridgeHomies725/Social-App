import {
	infiniteQueryOptions,
	queryOptions,
	useMutation,
	useQueryClient,
	type InfiniteData,
} from "@tanstack/react-query";

import {
	createPostServerFn,
	createCommentServerFn,
	getPostByIdServerFn,
	getPostsServerFn,
	toggleLikeServerFn,
	uploadImageServerFn,
} from "#/server/post.function";

import type { PostDetail } from "../types/post";

export const postKeys = {
	all: ["posts"] as const,
	feed: () => [...postKeys.all, "feed"] as const,
	detail: (id: string) => [...postKeys.all, "detail", id] as const,
};

export const feedQueryOptions = () =>
	infiniteQueryOptions({
		queryKey: postKeys.feed(),
		queryFn: ({ pageParam }) =>
			getPostsServerFn({ data: { cursor: pageParam } }),
		initialPageParam: undefined as string | undefined,
		staleTime: 30_000,
		getNextPageParam: (lastPage) =>
			lastPage.nextCursor ?? undefined,
	});

export const postDetailQueryOptions = (postId: string) =>
	queryOptions({
		queryKey: postKeys.detail(postId),
		queryFn: () => getPostByIdServerFn({ data: { postId } }),
	});

export function useCreatePostMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (data: { text: string; imageUrl: string }) =>
			createPostServerFn({ data }),

		onSuccess: async () => {
			await queryClient.invalidateQueries({
				queryKey: postKeys.feed(),
			});
		},
	});
}

export function useUploadImageMutation() {
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();

      formData.append("image", file);

      return uploadImageServerFn({
        data: formData,
      });
    },
  });
}

export function useToggleLikeMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (postId: string) =>
			toggleLikeServerFn({ data: { postId } }),

		onSuccess: (data) => {
			queryClient.setQueriesData<
				InfiniteData<Awaited<ReturnType<typeof getPostsServerFn>>>
			>(
				{ queryKey: postKeys.feed() },
				(oldData) => {
					if (!oldData) return oldData;

					return {
						...oldData,
						pages: oldData.pages.map((page) => ({
							...page,
							posts: page.posts.map((post) =>
								post.id === data.postId
									? {
											...post,
											likes: data.likes,
											isLiked: data.isLiked,
										}
									: post,
							),
						})),
					};
				},
			);

			queryClient.setQueryData<PostDetail | null>(
				postKeys.detail(data.postId),
				(oldPost) => {
					if (!oldPost) return oldPost;

					return {
						...oldPost,
						likes: data.likes,
						isLiked: data.isLiked,
					};
				},
			);
		},
	});
}

export function useCreateCommentMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (data: {
			postId: string;
			comment: string;
		}) => createCommentServerFn({ data }),

		onSuccess: async (newComment, variables) => {
			queryClient.setQueryData<PostDetail | null>(
				postKeys.detail(variables.postId),
				(oldPost) => {
					if (!oldPost) return oldPost;

					return {
						...oldPost,
						comments: [
							...oldPost.comments,
							newComment,
						],
					};
				},
			);

			await queryClient.invalidateQueries({
				queryKey: postKeys.feed(),
			});
		},
	});
}
