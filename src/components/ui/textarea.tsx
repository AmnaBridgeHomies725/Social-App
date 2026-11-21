import type React from "react";

export function Textarea({
	className = "",
	ref,
	...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
	ref?: React.Ref<HTMLTextAreaElement>;
}) {
	return (
		<textarea
			ref={ref}
			className={`flex min-h-[90px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
			{...props}
		/>
	);
}
