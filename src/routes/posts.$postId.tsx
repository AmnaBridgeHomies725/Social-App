
import { createFileRoute } from "@tanstack/react-router";
import PostDetail from "../pages/PostDetail";

export const Route = createFileRoute("/posts/$postId")({
  component: PostDetail,
});
