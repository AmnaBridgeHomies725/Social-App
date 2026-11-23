import path from "node:path";

export const UPLOAD_PATH_REGEX = /^\/uploads\/[a-zA-Z0-9-]+\.(jpg|jpeg|png|webp)$/i;

export function getUploadDir() {
	return process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");
}

export function detectImageType(buffer: Buffer): "image/jpeg" | "image/png" | "image/webp" | null {
	if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "image/jpeg";
	if (buffer.subarray(0, 8).toString("hex") === "89504e470d0a1a0a") return "image/png";
	if (buffer.subarray(0, 4).toString() === "RIFF" && buffer.subarray(8, 12).toString() === "WEBP") return "image/webp";
	return null;
}
