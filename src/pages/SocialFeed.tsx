
import { useEffect, useState } from "react";

import PostCard from "../components/PostCard";
import { getPosts } from "../data/postService";

import type { Post } from "../types/post";

function SocialFeed() {

  const [feedPosts, setFeedPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {

    async function loadPosts() {

      try {
        const data = await getPosts();

        setFeedPosts(data);

      } catch (error) {

        setError("Posts are not loading....");

      } finally {

        setLoading(false);

      }

    }

    loadPosts();

  }, []);

  if (loading) {
    return <h2>Loading posts...</h2>;
  }

  if (error) {
    return <h2>{error}</h2>;
  }

  return (
    <div className="social-feed">

      <h1>Home Feed</h1>

      <p>See what's happening in your community.</p>

      {feedPosts.map((post) => (

        <PostCard
          key={post.id}
          post={post}
          currentUser="Areena"
        />

      ))}

    </div>
  );
}

export default SocialFeed;
