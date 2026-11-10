"use client";

import { cn } from "cn";
import type * as React from "react";

function Label({
	className,
	children,
	htmlFor,
	...props
}: React.ComponentProps<"label">) {
	return (
		<label
			data-slot="label"
			htmlFor={htmlFor ?? "form-label"}
			className={cn(
				"flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
				className,
			)}
			{...props}
		>
			{children ?? <span className="sr-only">Label</span>}
		</label>
	);
}

export { Label };
