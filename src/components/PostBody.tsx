import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import type { Post } from "../types/post";
import UserAvatar from "./UserAvatar";
import { formatTimestamp } from "../lib/format";

export default function PostBody({ post, summary = false, detail = false, children }: { post: Post; summary?: boolean; detail?: boolean; children?: ReactNode }) {
	return <>
		<header className="post-card-header">
			<div className="flex min-w-0 items-center gap-3">
				<UserAvatar name={post.userName} imageUrl={post.userImageUrl} size={44} />
				<div className="min-w-0">{detail ? <h2 className="post-card-author">{post.userName}</h2> : <h3 className="post-card-author">{post.userName}</h3>}{detail ? <time dateTime={post.timestamp} className="post-card-time">{formatTimestamp(post.timestamp)}</time> : <p className="post-card-time">{formatTimestamp(post.timestamp)}</p>}</div>
			</div>
		</header>
		<div className="post-card-content">
			{post.imageUrl && <img src={post.imageUrl} alt={detail ? `Post by ${post.userName}` : `${post.userName}'s post`} loading={!detail ? "lazy" : undefined} width={!detail ? 800 : undefined} height={!detail ? 500 : undefined} className="post-card-image" />}
			{post.text && <p className={`post-card-text${detail ? " leading-7" : ""}`}>{post.text}</p>}
			{summary && <div className="post-card-summary"><span>{post.likes} likes · {post.commentCount ?? 0} comments</span><Link to="/posts/$postId" params={{ postId: post.id }} className="post-card-details-link">View details →</Link></div>}
			{children}
		</div>
	</>;
}
