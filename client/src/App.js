import { useEffect, useState } from "react";
import Layout from "./components/Layout";
import LoginPage from "./components/LoginPage";
import ItemsPage from "./pages/ItemsPage";
import AddItemPage from "./pages/AddItemPage";
import BorrowedPage from "./pages/BorrowedPage";
import SettingsPage from "./pages/SettingsPage";
import StatusPage from "./pages/StatusPage";
import UsersPage from "./pages/UsersPage";
import { getMe, login, logout } from "./api/api";

export default function App() {
  const [panel, setPanel] = useState("items");
  const [authChecked, setAuthChecked] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [role, setRole] = useState(null);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    const allowedPanels =
      role === "admin"
        ? ["items", "add", "borrowed", "users", "status", "settings"]
        : ["items", "borrowed", "status"];

    if (!allowedPanels.includes(panel)) {
      setPanel("items");
    }
  }, [role, panel]);

  async function checkAuth() {
    try {
      const me = await getMe();
      setAuthenticated(!!me.authenticated);
      setRole(me.authenticated ? me.role || "viewer" : null);
    } catch {
      setAuthenticated(false);
      setRole(null);
    } finally {
      setAuthChecked(true);
    }
  }

  async function handleLogin(username, password) {
    await login(username, password);
    const me = await getMe();
    setAuthenticated(!!me.authenticated);
    setRole(me.authenticated ? me.role || "viewer" : null);
    setPanel("items");
  }

  async function handleLogout() {
    await logout();
    setAuthenticated(false);
    setRole(null);
    setPanel("items");
  }

  if (!authChecked) {
    return <div className="empty-state">Loading...</div>;
  }

  if (!authenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  let page = null;

  if (panel === "items") {
    page = <ItemsPage role={role} />;
  } else if (panel === "borrowed") {
    page = <BorrowedPage role={role} />;
  } else if (panel === "status") {
    page = <StatusPage role={role} />;
  } else if (role === "admin" && panel === "add") {
    page = <AddItemPage />;
  } else if (role === "admin" && panel === "users") {
    page = <UsersPage />;
  } else if (role === "admin" && panel === "settings") {
    page = <SettingsPage />;
  } else {
    page = <ItemsPage role={role} />;
  }

  return (
    <Layout
      currentPanel={panel}
      setPanel={setPanel}
      onLogout={handleLogout}
      role={role}
    >
      {page}
    </Layout>
  );
}