import {
	queryOptions,
	useMutation,
	useQueryClient,
} from "@tanstack/react-query";
import {
	getMyProfileServerFn,
	saveMyProfileServerFn,
	uploadProfileImageServerFn,
} from "../server/profile.function";

export const profileQueryKey = ["profile", "me"] as const;

export const myProfileQueryOptions = () =>
	queryOptions({
		queryKey: profileQueryKey,
		queryFn: () => getMyProfileServerFn(),
	});

export function useSaveProfileMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (data: { username: string; bio: string; imageUrl: string }) =>
			saveMyProfileServerFn({ data }),
		onSuccess: async (profile) => {
			queryClient.setQueryData(profileQueryKey, profile);
			await queryClient.invalidateQueries({ queryKey: ["posts"] });
		},
	});
}

export function useUploadProfileImageMutation() {
	return useMutation({
		mutationFn: (file: File) => {
			const formData = new FormData();
			formData.append("image", file);
			return uploadProfileImageServerFn({ data: formData });
		},
	});
}
