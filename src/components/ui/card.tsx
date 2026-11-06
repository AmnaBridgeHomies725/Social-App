import type React from "react";

export function Card({
	className = "",
	children,
	...props
}: React.HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			className={`rounded-xl border border-border bg-card text-card-foreground shadow-sm ${className}`}
			{...props}
		>
			{children}
		</div>
	);
}

export function CardHeader({
	className = "",
	children,
	...props
}: React.HTMLAttributes<HTMLDivElement>) {
	return (
		<div className={`p-6 pb-3 ${className}`} {...props}>
			{children}
		</div>
	);
}

export function CardTitle({
	className = "",
	children,
	...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
	return (
		<h3
			className={`text-lg font-semibold leading-none tracking-tight ${className}`}
			{...props}
		>
			{children}
		</h3>
	);
}

export function CardContent({
	className = "",
	children,
	...props
}: React.HTMLAttributes<HTMLDivElement>) {
	return (
		<div className={`p-6 pt-3 ${className}`} {...props}>
			{children}
		</div>
	);
}
