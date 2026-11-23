export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export function validateImageFile(file: File): string | null {
	if (!ALLOWED_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_TYPES)[number])) return "Only JPG, PNG, and WEBP images are allowed.";
	if (file.size > MAX_IMAGE_BYTES) return "Image size must be less than 5 MB.";
	return null;
}
