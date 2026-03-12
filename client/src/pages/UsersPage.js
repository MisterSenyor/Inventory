import { useEffect, useMemo, useState } from "react";
import { addUser, editUser, getUsers, removeUser } from "../api/api";

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [newId, setNewId] = useState("");
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      setLoading(true);
      setError("");
      const loaded = await getUsers();
      setUsers(Array.isArray(loaded) ? loaded : []);
    } catch (err) {
      setError(err.message || "טעינת המשתמשים נכשלה");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddUser() {
    try {
      setSaving(true);
      setError("");

      await addUser({
        id: newId.trim(),
        name: newName.trim(),
        phoneNumber: newPhone.trim(),
      });

      setNewId("");
      setNewName("");
      setNewPhone("");
      await load();
    } catch (err) {
      setError(err.message || "הוספת המשתמש נכשלה");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveEdit() {
    try {
      setSaving(true);
      setError("");

      await editUser(editingId, {
        name: editName.trim(),
        phoneNumber: editPhone.trim(),
      });

      setEditingId(null);
      setEditName("");
      setEditPhone("");
      await load();
    } catch (err) {
      setError(err.message || "עדכון המשתמש נכשל");
    } finally {
      setSaving(false);
    }
  }

  async function handleRemoveUser(user) {
    const confirmed = window.confirm(
      `למחוק את המשתמש "${user.name}" (${user.id})?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setSaving(true);
      setError("");
      await removeUser(user.id);
      await load();
    } catch (err) {
      setError(err.message || "מחיקת המשתמש נכשלה");
    } finally {
      setSaving(false);
    }
  }

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) {
      return users;
    }

    return users.filter((user) => {
      const id = String(user.id || "").toLowerCase();
      const name = String(user.name || "").toLowerCase();
      const phone = String(user.phoneNumber || "").toLowerCase();

      return id.includes(q) || name.includes(q) || phone.includes(q);
    });
  }, [users, search]);

  function startEdit(user) {
    setEditingId(user.id);
    setEditName(user.name || "");
    setEditPhone(user.phoneNumber || "");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditName("");
    setEditPhone("");
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">משתמשים</h1>
        <div className="page-subtitle">
          ניהול אנשי קשר להשאלות ובחירה מהרשימה בעת השאלת פריט.
        </div>
      </div>

      {error && <div className="notice-error">{error}</div>}

      <div className="grid-two" style={{ gridTemplateColumns: "420px 1fr" }}>
        <div className="section-stack">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">הוספת משתמש</h3>
            </div>
            <div className="card-body form-grid">
              <div>
                <label className="label">מזהה</label>
                <input
                  className="input"
                  value={newId}
                  onChange={(e) => setNewId(e.target.value)}
                  placeholder="מזהה משתמש"
                />
              </div>

              <div>
                <label className="label">שם</label>
                <input
                  className="input"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="שם מלא"
                />
              </div>

              <div>
                <label className="label">טלפון</label>
                <input
                  className="input"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="מספר טלפון"
                />
              </div>

              <div>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={saving || !newId.trim() || !newName.trim()}
                  onClick={handleAddUser}
                >
                  {saving ? "מוסיף..." : "הוסף משתמש"}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">רשימת משתמשים</h3>
          </div>
          <div className="card-body">
            <div style={{ marginBottom: 16 }}>
              <label className="label">חיפוש</label>
              <input
                className="input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="חפש לפי שם, מזהה או טלפון"
              />
            </div>

            {loading ? (
              <div className="empty-state">טוען משתמשים...</div>
            ) : filteredUsers.length === 0 ? (
              <div className="empty-state">לא נמצאו משתמשים.</div>
            ) : (
              <div className="tree-list">
                {filteredUsers.map((user) => {
                  const isEditing = editingId === user.id;

                  return (
                    <div className="tree-node" key={user.id}>
                      <div className="tree-node-inner">
                        {isEditing ? (
                          <div className="form-grid">
                            <div>
                              <label className="label">מזהה</label>
                              <input
                                className="input"
                                value={user.id}
                                disabled
                              />
                            </div>

                            <div>
                              <label className="label">שם</label>
                              <input
                                className="input"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                              />
                            </div>

                            <div>
                              <label className="label">טלפון</label>
                              <input
                                className="input"
                                value={editPhone}
                                onChange={(e) => setEditPhone(e.target.value)}
                              />
                            </div>

                            <div className="toolbar">
                              <button
                                type="button"
                                className="btn btn-primary"
                                disabled={saving || !editName.trim()}
                                onClick={handleSaveEdit}
                              >
                                {saving ? "שומר..." : "שמור"}
                              </button>

                              <button
                                type="button"
                                className="btn btn-secondary"
                                disabled={saving}
                                onClick={cancelEdit}
                              >
                                ביטול
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="tree-node-top">
                              <div className="tree-node-left">
                                <div>
                                  <div className="tree-node-name">{user.name}</div>
                                  <div className="tree-node-meta">
                                    <span className="meta-badge">
                                      מזהה {user.id}
                                    </span>
                                    <span className="meta-badge">
                                      {user.phoneNumber || "ללא טלפון"}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="tree-node-actions">
                                <button
                                  type="button"
                                  className="btn btn-secondary btn-small"
                                  disabled={saving}
                                  onClick={() => startEdit(user)}
                                >
                                  עריכה
                                </button>

                                <button
                                  type="button"
                                  className="btn btn-danger btn-small"
                                  disabled={saving}
                                  onClick={() => handleRemoveUser(user)}
                                >
                                  מחיקה
                                </button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}