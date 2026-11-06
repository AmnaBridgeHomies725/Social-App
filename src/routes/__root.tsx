import { createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";

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
			{ name: "viewport", content: "width=device-width, initial-scale=1.0" },
			{ title: "Social App" },
		],
		links: [{ rel: "stylesheet", href: appCss }],
	}),
	shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				<script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
				<HeadContent />
			</head>
			<body>
				<div className="app-shell">
					<Sidebar />
					<main className="app-main">{children}</main>
				</div>
				<Scripts />
			</body>
		</html>
	);
}
