
import { posts } from "./posts";
import type { Post } from "../types/post";

export function getPosts(): Promise<Post[]> {
  return new Promise((resolve, reject) => {

    setTimeout(() => {
      if (posts.length > 0) {
        resolve(posts);
      } else {
        reject(new Error("Posts not found"));
      }
    }, 1000);

  });
}
