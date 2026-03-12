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

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const me = await getMe();
      setAuthenticated(!!me.authenticated);
    } catch {
      setAuthenticated(false);
    } finally {
      setAuthChecked(true);
    }
  }

  async function handleLogin(username, password) {
    await login(username, password);
    const me = await getMe();
    setAuthenticated(!!me.authenticated);
  }

  async function handleLogout() {
    await logout();
    setAuthenticated(false);
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
    page = <ItemsPage />;
  } else if (panel === "add") {
    page = <AddItemPage />;
  } else if (panel === "borrowed") {
    page = <BorrowedPage />;
  } else if (panel === "users") {
    page = <UsersPage />;
  } else if (panel === "status") {
    page = <StatusPage />;
  } else {
    page = <SettingsPage />;
  }

  return (
    <Layout currentPanel={panel} setPanel={setPanel} onLogout={handleLogout}>
      {page}
    </Layout>
  );
}