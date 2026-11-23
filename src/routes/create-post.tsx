import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ImagePlus, Upload, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import UserAvatar from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useCreatePostMutation, useUploadImageMutation } from "../queries/post";
import { myProfileQueryOptions } from "../queries/profile";
import { deleteUploadedImageServerFn } from "../server/post.function";
import { validateImageFile } from "../lib/upload";
import CharacterCounter from "../components/CharacterCounter";

export const Route = createFileRoute("/create-post")({
	loader: ({ context }) =>
		context.queryClient.ensureQueryData(myProfileQueryOptions()),
	component: CreatePost,
});

function CreatePost() {
	const navigate = useNavigate();
	const { data: profile } = useSuspenseQuery(myProfileQueryOptions());
	const createPostMutation = useCreatePostMutation();
	const uploadImageMutation = useUploadImageMutation();
	const imageInput = useRef<HTMLInputElement>(null);
	const [text, setText] = useState("");
	const [imageFile, setImageFile] = useState<File | null>(null);
	const [imagePreview, setImagePreview] = useState("");
	const [error, setError] = useState("");
	const [isDragging, setIsDragging] = useState(false);

	useEffect(() => {
		if (!imageFile) {
			setImagePreview("");
			return;
		}
		const previewUrl = URL.createObjectURL(imageFile);
		setImagePreview(previewUrl);
		return () => URL.revokeObjectURL(previewUrl);
	}, [imageFile]);

	function selectImage(file?: File) {
		setError("");
		if (!file) return;
		const validationError = validateImageFile(file);
		if (validationError) { setError(validationError); return; }
		setImageFile(file);
	}

	async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setError("");
		let uploadedImageUrl = "";
		try {
			let imageUrl = "";
			if (imageFile) {
				const uploadResult = await uploadImageMutation.mutateAsync(imageFile);
				imageUrl = uploadResult.imageUrl;
				uploadedImageUrl = imageUrl;
			}
			await createPostMutation.mutateAsync({ text, imageUrl });
			await navigate({ to: "/" });
		} catch (err) {
			if (uploadedImageUrl) {
				try {
					await deleteUploadedImageServerFn({
						data: { imageUrl: uploadedImageUrl },
					});
				} catch {
					// The post error is more useful than a cleanup error here.
				}
			}
			setError(
				err instanceof Error
					? err.message
					: "Something went wrong. Please try again.",
			);
		}
	}

	const isSubmitting =
		createPostMutation.isPending || uploadImageMutation.isPending;

	return (
		<main className="create-post-page">
			<header className="create-post-heading">
				<h1>Create Post</h1>
				<p>Share with your community</p>
			</header>

			<form className="create-post-card" onSubmit={handleSubmit}>
				<div className="create-post-author">
					<UserAvatar
						name={profile.username}
						imageUrl={profile.imageUrl}
						size={48}
					/>
					<div>
						<strong>{profile.username}</strong>
						<span>Share with your community</span>
					</div>
				</div>

				<Textarea
					className="create-post-textarea"
					placeholder="What's happening in your community?"
					value={text}
					maxLength={500}
					required
					onChange={(event) => {
						setText(event.target.value);
						setError("");
					}}
				/>

				<div className="create-post-counter-row">
					<div className="create-post-progress">
						<span style={{ width: `${(text.length / 500) * 100}%` }} />
					</div>
					<CharacterCounter value={text} max={500} /> characters
				</div>

				<section
					className={`create-post-dropzone${isDragging ? " is-dragging" : ""}${imagePreview ? " has-preview" : ""}`}
					aria-label="Drop a post photo here or choose a file below"
					onDragOver={(event) => {
						event.preventDefault();
						setIsDragging(true);
					}}
					onDragLeave={() => setIsDragging(false)}
					onDrop={(event) => {
						event.preventDefault();
						setIsDragging(false);
						selectImage(event.dataTransfer.files[0]);
					}}
				>
					<input
						ref={imageInput}
						type="file"
						accept="image/jpeg,image/png,image/webp"
						className="sr-only"
						onChange={(event) => selectImage(event.target.files?.[0])}
					/>
					{imagePreview ? (
						<>
							<img src={imagePreview} alt="Selected post preview" />
							<button
								type="button"
								className="create-post-remove-image"
								aria-label="Remove selected image"
								onClick={(event) => {
									event.stopPropagation();
									setImageFile(null);
								}}
							>
								<X size={18} />
							</button>
						</>
					) : (
						<span className="create-post-drop-content">
							<span className="create-post-image-icon">
								<ImagePlus size={23} />
							</span>
							<strong>Add a photo</strong>
							<small>Drag and drop an image here or choose a file</small>
							<button
								type="button"
								className="create-post-choose-button"
								onClick={() => imageInput.current?.click()}
							>
								<Upload size={14} /> Choose file
							</button>
						</span>
					)}
				</section>
				<p className="create-post-file-help">JPG, PNG ya WEBP; maximum 5 MB.</p>
				{error && (
					<p role="alert" className="create-post-error">
						{error}
					</p>
				)}

				<footer className="create-post-actions">
					<Link to="/" className="create-post-cancel">
						Cancel
					</Link>
					<Button type="submit" disabled={isSubmitting}>
						{uploadImageMutation.isPending
							? "Uploading image..."
							: createPostMutation.isPending
								? "Creating post..."
								: "Create Post"}
					</Button>
				</footer>
			</form>
		</main>
	);
}
