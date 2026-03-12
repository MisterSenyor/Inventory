import { useEffect, useMemo, useState } from "react";
import { getItems, getUsers, returnItem } from "../api/api";
import BorrowedTree from "../components/BorrowedTree";

export default function BorrowedPage() {
  const [items, setItems] = useState([]);
  const [users, setUsers] = useState([]);
  const [friend, setFriend] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    try {
      setLoading(true);
      setError("");

      const [loadedItems, loadedUsers] = await Promise.all([
        getItems(),
        getUsers(),
      ]);

      const loadedArray = Array.isArray(loadedItems) ? loadedItems : [];
      setItems(loadedArray.filter((item) => item.loanedTo));
      setUsers(Array.isArray(loadedUsers) ? loadedUsers : []);
    } catch (err) {
      setError(err.message || "טעינת הפריטים המושאלים נכשלה");
      setItems([]);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const usersById = useMemo(() => {
    const map = {};
    for (const user of users) {
      map[String(user.id)] = user;
    }
    return map;
  }, [users]);

  const filtered = useMemo(() => {
    const friendQuery = friend.trim().toLowerCase();
    const itemQuery = search.trim().toLowerCase();

    return items.filter((item) => {
      const borrower = usersById[String(item.loanedTo)] || null;
      const borrowerText = [
        String(item.loanedTo || ""),
        String(borrower?.name || ""),
        String(borrower?.phoneNumber || ""),
      ]
        .join(" ")
        .toLowerCase();

      const friendMatch = !friendQuery || borrowerText.includes(friendQuery);

      const itemMatch =
        !itemQuery || String(item.name || "").toLowerCase().includes(itemQuery);

      return friendMatch && itemMatch;
    });
  }, [items, friend, search, usersById]);

  if (loading) {
    return <div className="empty-state">טוען פריטים מושאלים...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">פריטים מושאלים</h1>
        <div className="page-subtitle">
          מעקב אחר פריטים מושאלים והחזרה של פריט בודד.
        </div>
      </div>

      {error && <div className="notice-error">{error}</div>}

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-body">
          <div className="toolbar">
            <div style={{ minWidth: 230 }}>
              <label className="label">שואל</label>
              <input
                className="input"
                placeholder="סינון לפי שם / מזהה / טלפון"
                value={friend}
                onChange={(e) => setFriend(e.target.value)}
              />
            </div>

            <div style={{ minWidth: 230 }}>
              <label className="label">שם פריט</label>
              <input
                className="input"
                placeholder="סינון לפי שם פריט"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <BorrowedTree
        items={filtered}
        users={users}
        onReturnTree={async (id) => {
          await returnItem(id);
          await load();
        }}
      />
    </div>
  );
}