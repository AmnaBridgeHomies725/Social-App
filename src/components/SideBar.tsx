import { Link, useNavigate } from "@tanstack/react-router";

function SideBar() {
	const navigate = useNavigate();

	const linkClass =
		"sidebar-link flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent";

	const activeClass = `${linkClass} bg-accent text-accent-foreground`;

	const handleLogout = () => {
		localStorage.removeItem("user");
		localStorage.removeItem("token");
		localStorage.removeItem("email");

		navigate({ to: "/login" });
	};

	return (
		<aside className="app-sidebar" aria-label="Main navigation">
			<h2 className="sidebar-logo">💬 Social App</h2>

			<p className="sidebar-menu-label">MENU</p>

			<nav className="sidebar-nav">
				<Link
					to="/"
					className={linkClass}
					activeProps={{ className: activeClass }}
				>
					<span>🏠</span>
					<span>Home</span>
				</Link>

				<Link
					to="/create-post"
					className={linkClass}
					activeProps={{ className: activeClass }}
				>
					<span>✏️</span>
					<span>Create Post</span>
				</Link>

				<Link
					to="/settings"
					className={linkClass}
					activeProps={{ className: activeClass }}
				>
					<span>⚙️</span>
					<span>Settings</span>
				</Link>
			</nav>

			<div className="sidebar-footer">
				<h3 className="font-semibold">Social App</h3>
				<p>Made with React and TypeScript</p>

				<button
					type="button"
					onClick={handleLogout}
					className="mt-4 w-full rounded-md bg-red-500 px-3 py-2 text-sm text-white hover:bg-red-600"
				>
					🚪 Logout
				</button>
			</div>
		</aside>
	);
}

export default SideBar;
