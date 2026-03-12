export default function Layout({ currentPanel, setPanel, onLogout, children }) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">טקסטילון</div>
        <div className="sidebar-subtitle">
          ניהול מלאי והשאלות
        </div>

        <nav className="sidebar-nav">
          <button
            className={`sidebar-button ${currentPanel === "items" ? "active" : ""}`}
            onClick={() => setPanel("items")}
          >
            מלאי
          </button>

          <button
            className={`sidebar-button ${currentPanel === "add" ? "active" : ""}`}
            onClick={() => setPanel("add")}
          >
            הוספת פריט
          </button>

          <button
            className={`sidebar-button ${currentPanel === "borrowed" ? "active" : ""}`}
            onClick={() => setPanel("borrowed")}
          >
            מושאלים
          </button>

          <button
            className={`sidebar-button ${currentPanel === "users" ? "active" : ""}`}
            onClick={() => setPanel("users")}
          >
            משתמשים
          </button>

          <button
            className={`sidebar-button ${currentPanel === "status" ? "active" : ""}`}
            onClick={() => setPanel("status")}
          >
            סטטוס
          </button>

          <button
            className={`sidebar-button ${currentPanel === "settings" ? "active" : ""}`}
            onClick={() => setPanel("settings")}
          >
            הגדרות
          </button>
        </nav>

        <div style={{ marginTop: 20 }}>
          <button className="sidebar-button" onClick={onLogout}>
            התנתקות
          </button>
        </div>
      </aside>

      <main className="main-content">{children}</main>
    </div>
  );
}