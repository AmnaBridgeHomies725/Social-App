import type { Post } from "../types/post";
import image1 from "../assets/images/image1.png";

export const posts: Post[] = [
    {
        id: 1,
        author: "Amna",
        text: "Sunsets are proof that no matter what happens, every day can end beautifully. ",
        imageUrl: "https://images.pexels.com/photos/844297/pexels-photo-844297.jpeg?auto=compress&cs=tinysrgb&w=800",
        timestamp: "2023-08-01T10:00:00Z",
        likes: 15,
        comments: ["Stunning sunset!", "So calm and peaceful", "Great capture!"],
    },
    {
        id: 2,
        author: "Sarah",
        text: "Enjoying the lush green environment while learning component-based development! ",
        imageUrl: image1,
        timestamp: "2023-08-02T14:30:00Z",
        likes: 10,
        comments: ["Very inspiring!", "Keep it up"],
    },
    {
        id: 3,
        author: "Uswa",
        text: "Fresh colorful roses blooming in full glory today! ",
        imageUrl: "https://images.pexels.com/photos/56866/garden-rose-red-pink-56866.jpeg?auto=compress&cs=tinysrgb&w=800",
        timestamp: "2023-08-03T09:15:00Z",
        likes: 8,
        comments: ["So colorful! ", "Nature is lovely ", "Great work"],
    },
    {
        id: 4,
        author: "Areena",
        text: "Snow-capped mountains and crisp fresh air are absolutely breathtaking!",
        imageUrl: "https://images.pexels.com/photos/417173/pexels-photo-417173.jpeg?auto=compress&cs=tinysrgb&w=800",
        timestamp: "2023-08-04T11:45:00Z",
        likes: 12,
        comments: ["Majestic view! ", "Such a great shot!", "Amazing scenery"],
    },
    {
        id: 5,
        author: "Zainab",
        text: "White lilies are my absolute favorite. They symbolize pure elegance and beauty! ",
        imageUrl: "https://images.pexels.com/photos/107596/pexels-photo-107596.jpeg?auto=compress&cs=tinysrgb&w=800",
        timestamp: "2023-08-05T08:00:00Z",
        likes: 6,
        comments: ["Pure elegance ", "Beautiful lilies!", "Loved this photo"],
    },
];