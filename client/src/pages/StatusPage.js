import { useEffect, useMemo, useState } from "react";
import { getItems } from "../api/api";

export default function StatusPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      setLoading(true);
      setError("");
      const loaded = await getItems();
      setItems(Array.isArray(loaded) ? loaded : []);
    } catch (err) {
      setError(err.message || "טעינת הסטטוס נכשלה");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  const grouped = useMemo(() => {
    const map = new Map();

    for (const item of items) {
      const name = String(item.name || "").trim() || "ללא שם";

      if (!map.has(name)) {
        map.set(name, {
          name,
          total: 0,
          available: 0,
          borrowed: 0,
        });
      }

      const entry = map.get(name);
      entry.total += 1;

      if (item.loanedTo) {
        entry.borrowed += 1;
      } else {
        entry.available += 1;
      }
    }

    return Array.from(map.values()).sort((a, b) =>
      a.name.localeCompare(b.name, "he")
    );
  }, [items]);

  if (loading) {
    return <div className="empty-state">טוען סטטוס...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">סטטוס</h1>
        <div className="page-subtitle">
          סיכום כמויות לפי שם פריט.
        </div>
      </div>

      {error && <div className="notice-error">{error}</div>}

      {grouped.length === 0 ? (
        <div className="empty-state">לא נמצאו פריטים.</div>
      ) : (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">כמויות לפי שם</h3>
          </div>
          <div className="card-body">
            <div className="status-table-wrap">
              <table className="status-table">
                <thead>
                  <tr>
                    <th>שם פריט</th>
                    <th>סה״כ</th>
                    <th>זמינים</th>
                    <th>מושאלים</th>
                  </tr>
                </thead>
                <tbody>
                  {grouped.map((row) => (
                    <tr key={row.name}>
                      <td>{row.name}</td>
                      <td>{row.total}</td>
                      <td>{row.available}</td>
                      <td>{row.borrowed}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}