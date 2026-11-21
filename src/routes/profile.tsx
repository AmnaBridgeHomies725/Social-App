import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Camera, Check, Upload } from "lucide-react";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { deleteUploadedImageServerFn } from "../server/post.function";
import { isValidUsername } from "../lib/validation";
import { validateImageFile } from "../lib/upload";
import CharacterCounter from "../components/CharacterCounter";
import {
	myProfileQueryOptions,
	useSaveProfileMutation,
	useUploadProfileImageMutation,
} from "../queries/profile";

export const Route = createFileRoute("/profile")({
	loader: ({ context }) =>
		context.queryClient.ensureQueryData(myProfileQueryOptions()),
	component: ProfilePage,
});

function ProfilePage() {
	const { data: profile } = useSuspenseQuery(myProfileQueryOptions());
	const saveProfile = useSaveProfileMutation();
	const uploadImage = useUploadProfileImageMutation();
	const photoInput = useRef<HTMLInputElement>(null);
	const [username, setUsername] = useState(profile.username);
	const [bio, setBio] = useState(profile.bio);
	const [imageUrl, setImageUrl] = useState(profile.imageUrl);
	const [imageFile, setImageFile] = useState<File | null>(null);
	const [previewUrl, setPreviewUrl] = useState(profile.imageUrl);
	const [error, setError] = useState("");
	const [message, setMessage] = useState("");

	useEffect(() => {
		if (!imageFile) {
			setPreviewUrl(imageUrl);
			return;
		}
		const objectUrl = URL.createObjectURL(imageFile);
		setPreviewUrl(objectUrl);
		return () => URL.revokeObjectURL(objectUrl);
	}, [imageFile, imageUrl]);

	function selectPhoto(file?: File) {
		setError("");
		setMessage("");
		if (!file) return;
		const validationError = validateImageFile(file);
		if (validationError) { setError(validationError); return; }
		setImageFile(file);
	}

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setError("");
		setMessage("");

		let uploadedImageUrl: string | null = null;
		try {
			let nextImageUrl = imageUrl;
			if (imageFile) {
				const uploadResult = await uploadImage.mutateAsync(imageFile);
				nextImageUrl = uploadResult.imageUrl;
				uploadedImageUrl = nextImageUrl;
			}

			const saved = await saveProfile.mutateAsync({
				username,
				bio,
				imageUrl: nextImageUrl,
			});
			setUsername(saved.username);
			setBio(saved.bio);
			setImageUrl(saved.imageUrl);
			setImageFile(null);
			setMessage("Profile updated successfully.");
		} catch (err) {
			if (uploadedImageUrl) await deleteUploadedImageServerFn({ data: { imageUrl: uploadedImageUrl } }).catch(() => undefined);
			setError(err instanceof Error ? err.message : "Profile update failed.");
		}
	}

	function discardChanges() {
		setUsername(profile.username);
		setBio(profile.bio);
		setImageUrl(profile.imageUrl);
		setImageFile(null);
		setError("");
		setMessage("");
		if (photoInput.current) photoInput.current.value = "";
	}

	const isSaving = saveProfile.isPending || uploadImage.isPending;
	const hasChanges =
		username !== profile.username ||
		bio !== profile.bio ||
		imageFile !== null ||
		imageUrl !== profile.imageUrl;

	return (
		<main className="profile-page">
			<header className="profile-page-heading">
				<h1>My Profile</h1>
				<p>Manage your username, bio, and profile photo.</p>
			</header>

			<form className="profile-layout" onSubmit={handleSubmit}>
				<section
					className="profile-photo-panel"
					aria-labelledby="profile-photo-title"
				>
					<h2 id="profile-photo-title">Profile photo</h2>
					<div className="profile-photo-preview">
						{previewUrl ? (
							<img src={previewUrl} alt="Profile preview" />
						) : (
							<span>{(username || "?").slice(0, 1).toUpperCase()}</span>
						)}
						<button
							type="button"
							className="profile-camera-button"
							onClick={() => photoInput.current?.click()}
							aria-label="Choose profile photo"
						>
							<Camera size={19} />
						</button>
					</div>
					<strong className="profile-photo-name">
						{username || "Your name"}
					</strong>
					<span className="profile-photo-handle">
						@{username || "username"}
					</span>
					<input
						ref={photoInput}
						id="profile-photo"
						type="file"
						accept="image/jpeg,image/png,image/webp"
						className="sr-only"
						onChange={(event) => selectPhoto(event.target.files?.[0])}
					/>
					<Button
						type="button"
						className="profile-upload-button"
						onClick={() => photoInput.current?.click()}
					>
						<Upload size={16} /> Upload photo
					</Button>
					<Button
						type="button"
						variant="outline"
						className="profile-remove-button"
						disabled={!previewUrl}
						onClick={() => {
							setImageFile(null);
							setImageUrl("");
							if (photoInput.current) photoInput.current.value = "";
						}}
					>
						Remove photo
					</Button>
					<p className="profile-photo-help">JPG, PNG ya WEBP; maximum 5 MB.</p>
				</section>

				<section
					className="profile-details-panel"
					aria-labelledby="profile-details-title"
				>
					<h2 id="profile-details-title">Profile details</h2>
					<div className="profile-field">
						<Label htmlFor="username">Username</Label>
						<div className="profile-username-input">
							<span aria-hidden="true">@</span>
							<Input
								id="username"
								value={username}
								minLength={3}
								maxLength={20}
								onChange={(event) => setUsername(event.target.value)}
								required
							/>
							{isValidUsername(username) && (
								<span className="profile-valid-icon">
									<Check size={14} />
								</span>
							)}
						</div>
      {username.length > 0 && !isValidUsername(username) && <p className="profile-form-message is-error">3-20 characters; letters, numbers, _ and . only.</p>}
					</div>
					<div className="profile-field">
						<Label htmlFor="bio">Bio</Label>
						<Textarea
							id="bio"
							value={bio}
							maxLength={160}
							onChange={(event) => setBio(event.target.value)}
							placeholder="Write a little about yourself"
						/>
						<div className="profile-bio-footer">
							<span>Write a little about yourself.</span>
							<CharacterCounter value={bio} max={160} />
						</div>
					</div>
					{error && (
						<p role="alert" className="profile-form-message is-error">
							{error}
						</p>
					)}
					{message && (
						<output className="profile-form-message is-success">
							{message}
						</output>
					)}
					<div className="profile-form-actions">
						<Button
							type="button"
							variant="outline"
							disabled={!hasChanges || isSaving}
							onClick={discardChanges}
						>
							Discard
						</Button>
						<Button type="submit" disabled={!hasChanges || isSaving}>
							{uploadImage.isPending
								? "Uploading photo..."
								: isSaving
									? "Saving..."
									: "Save profile"}
						</Button>
					</div>
				</section>
			</form>
		</main>
	);
}
