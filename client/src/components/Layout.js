export default function Layout({ currentPanel, setPanel, onLogout, role, children }) {
  const isAdmin = role === "admin";

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">טקסטילון</div>
        <div className="sidebar-subtitle">ניהול מלאי והשאלות</div>

        <div
          style={{
            marginTop: 10,
            marginBottom: 16,
            fontSize: 13,
            color: "#5f6b7a",
            background: "#f4f7fb",
            borderRadius: 10,
            padding: "8px 10px",
          }}
        >
          מחובר כ: {isAdmin ? "מנהל" : "משתמש השאלה"}
        </div>

        <nav className="sidebar-nav">
          <button
            className={`sidebar-button ${currentPanel === "items" ? "active" : ""}`}
            onClick={() => setPanel("items")}
          >
            מלאי
          </button>

          <button
            className={`sidebar-button ${currentPanel === "borrowed" ? "active" : ""}`}
            onClick={() => setPanel("borrowed")}
          >
            מושאלים
          </button>

          <button
            className={`sidebar-button ${currentPanel === "status" ? "active" : ""}`}
            onClick={() => setPanel("status")}
          >
            סטטוס
          </button>

          {isAdmin && (
            <>
              <button
                className={`sidebar-button ${currentPanel === "add" ? "active" : ""}`}
                onClick={() => setPanel("add")}
              >
                הוספת פריט
              </button>

              <button
                className={`sidebar-button ${currentPanel === "users" ? "active" : ""}`}
                onClick={() => setPanel("users")}
              >
                משתמשים
              </button>

              <button
                className={`sidebar-button ${currentPanel === "settings" ? "active" : ""}`}
                onClick={() => setPanel("settings")}
              >
                הגדרות
              </button>
            </>
          )}
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