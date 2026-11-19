import {
	createFileRoute,
	useNavigate,
} from "@tanstack/react-router";
import { useState , useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import {
  useCreatePostMutation,
  useUploadImageMutation,
} from "../queries/post";
import { deleteUploadedImageServerFn } from "../server/post.function";



export const Route = createFileRoute("/create-post")({
	component: CreatePost,
});

function CreatePost() {
	const navigate = useNavigate();
	const createPostMutation = useCreatePostMutation();
const uploadImageMutation = useUploadImageMutation();

	const [text, setText] = useState("");
	const [imageFile, setImageFile] = useState<File | null>(null);
	const [imagePreview, setImagePreview] = useState("");
	const [error, setError] = useState("");
	
useEffect(() => {
  if (!imageFile) {
    setImagePreview("");
    return;
  }

  const previewUrl = URL.createObjectURL(imageFile);
  setImagePreview(previewUrl);

  return () => {
    URL.revokeObjectURL(previewUrl);
  };
}, [imageFile]);

async function handleSubmit(event: React.FormEvent) {
  event.preventDefault();

  setError("");

  let uploadedImageUrl = "";

  try {
    let imageUrl = "";

    
    if (imageFile) {
      const uploadResult =
        await uploadImageMutation.mutateAsync(imageFile);

      imageUrl = uploadResult.imageUrl;
      uploadedImageUrl = imageUrl;
    }

   
    await createPostMutation.mutateAsync({
      text,
      imageUrl,
    });

    navigate({ to: "/" });
  } catch (err) {
    if (uploadedImageUrl) {
      try {
        await deleteUploadedImageServerFn({
          data: { imageUrl: uploadedImageUrl },
        });
      } catch {}
    }

    setError(
      err instanceof Error
        ? err.message
        : "Something went wrong. Please try again."
    );
  }
}


	return (
		<div className="mx-auto w-full max-w-2xl">
			<h1 className="mb-6 text-3xl font-bold tracking-tight">Create Post</h1>

			<Card>
				<CardHeader>
					<CardTitle>Share with your community</CardTitle>
				</CardHeader>

				<CardContent>
					<form className="flex flex-col gap-4" onSubmit={handleSubmit}>
						<Textarea
							placeholder="What's happening in your community?"
							value={text}
							maxLength={500}
							onChange={(e) => {
								setText(e.target.value);
								setError("");
							}}
						/>

						<p className="text-right text-sm text-muted-foreground">
							{text.length}/500 characters
						</p>

<Input
  type="file"
  accept="image/jpeg,image/png,image/webp"
  onChange={(e) => {
    const file = e.target.files?.[0] ?? null;

    setError("");

    if (!file) {
      setImageFile(null);
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setError("Only JPG, PNG, and WEBP images are allowed.");
      setImageFile(null);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5 MB.");
      setImageFile(null);
      return;
    }

    setImageFile(file);
  }}
/>
						{imagePreview && (
  <img
    src={imagePreview}
    alt="Selected image preview"
    className="max-h-80 w-full rounded-lg object-cover"
  />
)}

						

						{error && <p className="text-sm text-destructive">{error}</p>}

<Button
  type="submit"
  disabled={
    createPostMutation.isPending ||
    uploadImageMutation.isPending
  }
>
  {uploadImageMutation.isPending
    ? "Uploading image..."
    : createPostMutation.isPending
      ? "Creating post..."
      : "Create Post"}
</Button>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
