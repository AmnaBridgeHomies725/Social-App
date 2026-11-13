import type { Post } from "../types/post";

export const posts: Post[] = [
	{
		id: 1,
		author: "Amna",
		text: "Sunsets are proof that no matter what happens, every day can end beautifully.",
		imageUrl:
			"https://images.pexels.com/photos/844297/pexels-photo-844297.jpeg?auto=compress&cs=tinysrgb&w=800",
		timestamp: "2023-08-01T10:00:00Z",
		likes: 15,
		comments: ["Stunning sunset!", "So calm and peaceful", "Great capture!"],
	},
	{
		id: 2,
		author: "Sarah",
		text: "Enjoying the lush green environment while learning component-based development!",
		imageUrl:
			"https://images.pexels.com/photos/1072179/pexels-photo-1072179.jpeg?auto=compress&cs=tinysrgb&w=800",
		timestamp: "2023-08-02T14:30:00Z",
		likes: 10,
		comments: ["Very inspiring!", "Keep it up"],
	},
	{
		id: 3,
		author: "Uswa",
		text: "Fresh roses are adding color to the garden today!",
		imageUrl:
			"https://images.pexels.com/photos/56866/garden-rose-red-pink-56866.jpeg?auto=compress&cs=tinysrgb&w=800",
		timestamp: "2023-08-03T09:15:00Z",
		likes: 8,
		comments: ["Beautiful blooms!", "Love this rose color", "Lovely garden view"],
	},
	{
		id: 4,
		author: "Fatima",
		text: "Watching the sunset and enjoying a peaceful evening.",
		imageUrl:
			"https://images.pexels.com/photos/844297/pexels-photo-844297.jpeg?auto=compress&cs=tinysrgb&w=800",
		timestamp: "2023-08-04T10:00:00Z",
		likes: 8,
		comments: ["Beautiful sunset!", "Such a peaceful view", "Lovely evening"],
	},
	{
		id: 5,
		author: "Areena",
		text: "A quiet green place is perfect for a morning walk.",
		imageUrl:
			"https://images.pexels.com/photos/1072179/pexels-photo-1072179.jpeg?auto=compress&cs=tinysrgb&w=800",
		timestamp: "2023-08-05T10:00:00Z",
		likes: 8,
		comments: ["Refreshing greenery!", "Perfect walking spot", "Love this view"],
	},
];
