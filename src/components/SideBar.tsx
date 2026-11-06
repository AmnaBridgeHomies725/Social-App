import { Link } from "@tanstack/react-router";
import "../styles/SideBar.css";

function SideBar() {
    return (
        <aside className="sidebar">
            <h2 className="sidebar-logo">💬 Social App</h2>

            <p className="sidebar-label">MENU</p>

            <nav className="sidebar-nav">
                <Link
                    to="/"
                    className="sidebar-link"
                    activeProps={{
                        className: "sidebar-link active",
                    }}
                >
                    <span className="icon">🏠</span>
                    <span className="link-text">Home</span>
                </Link>

                <Link
                    to="/settings"
                    className="sidebar-link"
                    activeProps={{
                        className: "sidebar-link active",
                    }}
                >
                    <span className="icon">⚙️</span>
                    <span className="link-text">Settings</span>
                </Link>
            </nav>

            <div className="sidebar-bottom">
                <h3>Social App</h3>
                <p>Made with React and TypeScript</p>
            </div>
        </aside>
    );
}

export default SideBar;