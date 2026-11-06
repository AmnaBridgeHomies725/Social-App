import type React from "react";

export function Input({
	className = "",
	type = "text",
	...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
	return (
		<input
			type={type}
			className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
			{...props}
		/>
	);
}
