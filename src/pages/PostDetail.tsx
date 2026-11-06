
import { useParams } from "@tanstack/react-router";
import { posts } from "../data/posts";
import "../styles/PostCard.css";

function PostDetail() {
  const { postId } = useParams({
    from: "/posts/$postId",
  });

  const numericPostId = Number(postId);
  const post = posts.find(
    (item) => item.id === numericPostId
  );

  if (!post) {
    return <h2>Post not found!</h2>;
  }

  return (
    <div className="post-detail">

      <h1>Post Details</h1>

      <div className="post-card">

        <h2>{post.author}</h2>

        <div className="post-detail-image">
          <img src={post.imageUrl} alt={`${post.author}'s post`} />
        </div>

        <p>{post.text}</p>

        <div className="post-actions">
          <span>{post.likes} Likes</span>

          <span>
            {post.comments.length} Comments
          </span>
        </div>

      </div>

    </div>
  );
}

export default PostDetail;
