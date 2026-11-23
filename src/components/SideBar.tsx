import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useRouteContext } from "@tanstack/react-router";
import {
	Bookmark,
	ChevronLeft,
	ChevronRight,
	CirclePlus,
	House,
	LogOut,
	MessageCircle,
	UserRound,
} from "lucide-react";
import { useState } from "react";
import UserAvatar from "@/components/UserAvatar";
import { authClient } from "../lib/auth-client";
import { getSavedCountServerFn } from "../server/post.function";
import { myProfileQueryOptions } from "../queries/profile";

function SideBar() {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const [collapsed, setCollapsed] = useState(false);
	const { user: session } = useRouteContext({ from: "__root__" });
	const { data: profile } = useQuery(myProfileQueryOptions());
	const { data: savedCount = 0 } = useQuery({ queryKey: ["saved", "count"], queryFn: () => getSavedCountServerFn() });

	const linkClass = "sidebar-link";
	const activeClass = "sidebar-link is-active";

	const handleLogout = async () => {
		queryClient.clear();
		await authClient.signOut();
		navigate({ to: "/login" });
	};

	return (
		<aside
			className={`app-sidebar${collapsed ? " is-collapsed" : ""}`}
			aria-label="Main navigation"
		>
			<header className="sidebar-brand-row">
				<div className="sidebar-brand">
					<span className="sidebar-brand-icon">
						<MessageCircle size={19} />
					</span>
					<span className="sidebar-brand-copy">
						<strong>Social App</strong>
						<small>Your community</small>
					</span>
				</div>
				<button
					type="button"
					className="sidebar-collapse-button"
					aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
					title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
					onClick={() => setCollapsed((value) => !value)}
				>
					{collapsed ? <ChevronRight size={17} /> : <ChevronLeft size={17} />}
				</button>
			</header>

			<nav className="sidebar-nav" aria-label="Navigation">
				<div className="sidebar-nav-group">
					<p className="sidebar-menu-label">MENU</p>
					<Link
						to="/"
						className={linkClass}
						activeProps={{ className: activeClass }}
						title="Home"
					>
						<House size={19} />
						<span>Home</span>
					</Link>
					<Link
						to="/create-post"
						className={linkClass}
						activeProps={{ className: activeClass }}
						title="Create Post"
					>
						<CirclePlus size={19} />
						<span>Create Post</span>
					</Link>
					<Link
						to="/profile"
						className={linkClass}
						activeProps={{ className: activeClass }}
						title="My Profile"
					>
						<UserRound size={19} />
						<span>My Profile</span>
					</Link>
					<Link
						to="/saved-posts"
						className={linkClass}
						activeProps={{ className: activeClass }}
						title="Saved Posts"
					>
						<Bookmark size={19} />
						<span>Saved Posts</span>
						{savedCount > 0 && (
							<span className="sidebar-saved-count">
								{savedCount > 99 ? "99+" : savedCount}
							</span>
						)}
					</Link>
				</div>

			</nav>

			<footer className="sidebar-footer">
				<div className="sidebar-user-card">
					<Link
						to="/profile"
						className="sidebar-user-profile"
						aria-label="Open my profile"
					>
						<span className="sidebar-user-avatar">
							<UserAvatar
								name={profile?.username ?? "User"}
								imageUrl={profile?.imageUrl}
								size={40}
							/>
							<span className="sidebar-online-dot" />
						</span>
						<span className="sidebar-user-copy">
							<strong>{profile?.username ?? "My Profile"}</strong>
							<small>{session?.email ?? ""}</small>
						</span>
					</Link>
					<button
						type="button"
						className="sidebar-logout-button"
						aria-label="Log out"
						title="Log out"
						onClick={(event) => {
							event.preventDefault();
							event.stopPropagation();
							void handleLogout();
						}}
					>
						<LogOut size={17} />
					</button>
				</div>
			</footer>
		</aside>
	);
}

export default SideBar;
