import { useEffect, useMemo, useState } from "react";
import { getItems, returnItem } from "../api/api";
import BorrowedTree from "../components/BorrowedTree";

export default function BorrowedPage() {
  const [items, setItems] = useState([]);
  const [friend, setFriend] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    try {
      setLoading(true);
      setError("");
      const loaded = await getItems();
      const loadedArray = Array.isArray(loaded) ? loaded : [];
      setItems(loadedArray.filter((item) => item.loanedTo));
    } catch (err) {
      setError(err.message || "Failed to load borrowed items");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const friendQuery = friend.trim().toLowerCase();
    const itemQuery = search.trim().toLowerCase();

    return items.filter((item) => {
      const friendMatch =
        !friendQuery ||
        String(item.loanedTo || "").toLowerCase().includes(friendQuery);

      const itemMatch =
        !itemQuery || String(item.name || "").toLowerCase().includes(itemQuery);

      return friendMatch && itemMatch;
    });
  }, [items, friend, search]);

  if (loading) {
    return <div className="empty-state">Loading borrowed items...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Borrowed Items</h1>
        <div className="page-subtitle">
          Track borrowed items and return full item trees.
        </div>
      </div>

      {error && <div className="notice-error">{error}</div>}

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-body">
          <div className="toolbar">
            <div style={{ minWidth: 230 }}>
              <label className="label">User ID</label>
              <input
                className="input"
                placeholder="Filter by borrower"
                value={friend}
                onChange={(e) => setFriend(e.target.value)}
              />
            </div>

            <div style={{ minWidth: 230 }}>
              <label className="label">Item name</label>
              <input
                className="input"
                placeholder="Filter by item name"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <BorrowedTree
        items={filtered}
        onReturnTree={async (id) => {
          await returnItem(id);
          await load();
        }}
      />
    </div>
  );
}