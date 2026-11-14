import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import type { QueryClient } from "@tanstack/react-query";
import {
	createRootRouteWithContext,
	HeadContent,
	Link,
	Outlet,
	redirect,
	Scripts,
	useRouterState,
} from "@tanstack/react-router";
import { getSessionServerFn } from "#/server/session.function";
import Sidebar from "../components/SideBar";
import appCss from "../styles.css?url";

const publicPaths = ["/login", "/register"];
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

export const Route = createRootRouteWithContext<{
	queryClient: QueryClient;
}>()({
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
	beforeLoad: async ({ location }) => {
		const session = await getSessionServerFn();

		if (!session && !publicPaths.includes(location.pathname)) {
			throw redirect({ to: "/login" });
		}

		return { user: session };
	},
	component: RootComponent,
	shellComponent: RootDocument,
});

function RootComponent() {
	return (
		<>
			<Outlet />
			<ReactQueryDevtools buttonPosition="bottom-left" />
		</>
	);
}

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
	const isPublicPage = publicPaths.includes(routerState.location.pathname);

	if (isPublicPage) {
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