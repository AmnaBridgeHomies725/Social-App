import { createFileRoute } from "@tanstack/react-router";
import SocialFeed from "../pages/SocialFeed";
export const Route = createFileRoute("/")({
	component: SocialFeed,
});
