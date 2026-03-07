export default function Layout({ currentPanel, setPanel, onLogout, children }) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">BlueShelf</div>
        <div className="sidebar-subtitle">
          Inventory and lending management
        </div>

        <nav className="sidebar-nav">
          <button
            className={`sidebar-button ${currentPanel === "items" ? "active" : ""}`}
            onClick={() => setPanel("items")}
          >
            Inventory
          </button>

          <button
            className={`sidebar-button ${currentPanel === "add" ? "active" : ""}`}
            onClick={() => setPanel("add")}
          >
            Add Item
          </button>

          <button
            className={`sidebar-button ${currentPanel === "borrowed" ? "active" : ""}`}
            onClick={() => setPanel("borrowed")}
          >
            Borrowed
          </button>

          <button
            className={`sidebar-button ${currentPanel === "settings" ? "active" : ""}`}
            onClick={() => setPanel("settings")}
          >
            Settings
          </button>
        </nav>

        <div style={{ marginTop: 20 }}>
          <button className="sidebar-button" onClick={onLogout}>
            Logout
          </button>
        </div>
      </aside>

      <main className="main-content">{children}</main>
    </div>
  );
}