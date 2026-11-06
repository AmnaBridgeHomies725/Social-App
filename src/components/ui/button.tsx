import type React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: "default" | "outline" | "secondary" | "destructive";
	size?: "default" | "sm" | "lg";
}

export function Button({
	className = "",
	variant = "default",
	size = "default",
	type = "button",
	children,
	...props
}: ButtonProps) {
	const variantStyles = {
		default: "bg-primary text-primary-foreground hover:bg-primary/90",
		outline:
			"border border-border bg-background hover:bg-muted hover:text-foreground",
		secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
		destructive:
			"bg-destructive text-destructive-foreground hover:bg-destructive/90",
	};

	const sizeStyles = {
		default: "h-9 px-4 py-2 text-sm",
		sm: "h-8 px-3 text-xs",
		lg: "h-10 px-6 text-base",
	};

	return (
		<button
			type={type}
			className={`inline-flex items-center justify-center rounded-lg font-medium transition-colors outline-none cursor-pointer disabled:pointer-events-none disabled:opacity-50 ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
			{...props}
		>
			{children}
		</button>
	);
}
