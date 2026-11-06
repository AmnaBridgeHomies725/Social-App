import type React from "react";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
	variant?: "default" | "secondary" | "destructive" | "outline";
}

export function Badge({
	className = "",
	variant = "default",
	children,
	...props
}: BadgeProps) {
	const variantStyles = {
		default: "bg-primary text-primary-foreground",
		secondary: "bg-secondary text-secondary-foreground",
		destructive: "bg-destructive/10 text-destructive",
		outline: "border border-border text-foreground",
	};

	return (
		<span
			className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${variantStyles[variant]} ${className}`}
			{...props}
		>
			{children}
		</span>
	);
}
