import { NavLink, Outlet } from "react-router-dom";
import { useSettings } from "../hooks/useSettings.js";
import { useAuth } from "../context/AuthProvider.jsx";
import { fileUrl } from "../api/axios.js";

// Documents / Templates / Clients arrive in later phases (see PLAN.md).
const NAV = [
  { to: "/", label: "Dashboard", ready: true },
  { to: "/documents", label: "Documents", ready: true },
  { to: "/templates", label: "Templates", ready: true },
  { to: "/clients", label: "Clients", ready: true },
  { to: "/settings", label: "Settings", ready: true },
  { to: "/status", label: "System status", ready: true },
];

export default function AppShell() {
  const { data: settings } = useSettings();
  const { user, signOut } = useAuth();
  const logo = fileUrl(settings?.logo?.url);

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          {logo ? (
            <img src={logo} alt={settings?.company?.name ?? "Logo"} />
          ) : (
            <span className="sidebar-mark">DD</span>
          )}
          <div>
            <strong>{settings?.company?.name ?? "DynamoDesk"}</strong>
            <small>Document studio</small>
          </div>
        </div>

        <nav>
          {NAV.map((item) =>
            item.ready ? (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/" || item.to === "/documents"}
                className={({ isActive }) =>
                  `nav-link${isActive ? " active" : ""}`
                }
              >
                {item.label}
              </NavLink>
            ) : (
              <span
                key={item.to}
                className="nav-link disabled"
                title="Coming in a later phase"
              >
                {item.label}
              </span>
            ),
          )}
        </nav>

        <div className="sidebar-foot">
          <div className="sidebar-user">
            <strong>{user?.name}</strong>
            <small>{user?.email}</small>
          </div>
          <button type="button" className="btn btn-ghost" onClick={signOut}>
            Sign out
          </button>
        </div>
      </aside>

      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
