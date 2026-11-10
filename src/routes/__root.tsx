import {
	createRootRoute,
	HeadContent,
	Link,
	Scripts,
	useNavigate,
	useRouterState,
} from "@tanstack/react-router";
import { useEffect } from "react";
import Sidebar from "../components/SideBar";
import appCss from "../styles.css?url";

const THEME_INIT_SCRIPT = `
(function() {
  try {
    var stored = localStorage.getItem('theme');
    var mode = (stored === 'light' || stored === 'dark') ? stored : 'auto';
    var isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var activeTheme = mode === 'auto' ? (isDark ? 'dark' : 'light') : mode;
    
    var root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(activeTheme);
    
    if (mode === 'auto') {
      root.removeAttribute('data-theme');
    } else {
      root.setAttribute('data-theme', mode);
    }
  } catch(e) {}
})();
`;

export const Route = createRootRoute({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1.0",
			},
			{ title: "Social App" },
		],
		links: [{ rel: "stylesheet", href: appCss }],
	}),
	notFoundComponent: NotFound,
	shellComponent: RootDocument,
});

function NotFound() {
	return (
		<div className="mx-auto mt-16 max-w-md p-6 text-center">
			<h2 className="text-2xl font-bold">Page Not Found</h2>
			<p className="mt-2 text-sm text-muted-foreground">
				The page you are looking for does not exist.
			</p>
			<Link
				to="/"
				className="mt-4 inline-block rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
			>
				Go to Home
			</Link>
		</div>
	);
}

function AppLayout({ children }: { children: React.ReactNode }) {
	const routerState = useRouterState();
	const navigate = useNavigate();
	const isLoginPage = routerState.location.pathname === "/login";

	useEffect(() => {
		const user = localStorage.getItem("user");

		if (!user && !isLoginPage) {
			navigate({ to: "/login" });
		}
	}, [isLoginPage, navigate]);

	if (isLoginPage) {
		return <main className="w-full">{children}</main>;
	}

	return (
		<div className="app-shell">
			<Sidebar />
			<main className="app-main">{children}</main>
		</div>
	);
}

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				<script
					dangerouslySetInnerHTML={{
						__html: THEME_INIT_SCRIPT,
					}}
				/>
				<HeadContent />
			</head>

			<body>
				<AppLayout>{children}</AppLayout>
				<Scripts />
			</body>
		</html>
	);
}
