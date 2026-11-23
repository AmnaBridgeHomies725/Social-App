interface UserAvatarProps {
	name: string;
	imageUrl?: string | null;
	size?: number;
	fallbackClassName?: string;
}

function UserAvatar({ name, imageUrl, size = 40, fallbackClassName = "bg-primary/15 text-primary" }: UserAvatarProps) {
	const circleStyle = {
		width: size,
		height: size,
		minWidth: size,
		minHeight: size,
		borderRadius: "50%",
	};

	return (
		<div
			className="shrink-0 overflow-hidden"
			style={circleStyle}
			aria-hidden="true"
		>
			{imageUrl ? (
				<img
					src={imageUrl}
					alt=""
					className="block object-cover"
					style={{ ...circleStyle, maxWidth: "none" }}
				/>
			) : (
				<div
					className={`flex items-center justify-center text-sm font-semibold ${fallbackClassName}`}
					style={circleStyle}
				>
					{name.trim().slice(0, 1).toUpperCase() || "?"}
				</div>
			)}
		</div>
	);
}

export default UserAvatar;
