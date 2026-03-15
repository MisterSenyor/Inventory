import { useCallback, useEffect, useState } from "react";
import {
  editItem,
  getConfig,
  getItems,
  getUsers,
  loanItemWithChildren,
  removeItem,
  returnItemWithChildren,
} from "../api/api";
import Filters from "../components/Filters";
import ItemTree from "../components/ItemTree";
import EditItemModal from "../components/EditItemModal";

function buildFallbackConfig(items) {
  const classes = [...new Set((items || []).map((item) => item.class).filter(Boolean))];

  const typeNames = [...new Set((items || []).map((item) => item.type).filter(Boolean))];

  const types = typeNames.map((typeName) => {
    const matchingItems = (items || []).filter((item) => item.type === typeName);

    const fieldSet = new Set();
    matchingItems.forEach((item) => {
      Object.keys(item.fields || {}).forEach((key) => fieldSet.add(key));
    });

    return {
      name: typeName,
      fields: [...fieldSet],
    };
  });

  return { classes, types };
}

export default function ItemsPage({ role = "viewer" }) {
  const isAdmin = role === "admin";

  const [items, setItems] = useState([]);
  const [users, setUsers] = useState([]);
  const [config, setConfig] = useState(null);
  const [filters, setFilters] = useState({
    search: "",
    classes: [],
    type: "",
    fields: {},
  });
  const [editingItem, setEditingItem] = useState(null);

  const load = useCallback(async () => {
    if (isAdmin) {
      const [loadedItems, loadedConfig, loadedUsers] = await Promise.all([
        getItems(),
        getConfig(),
        getUsers(),
      ]);

      setItems(Array.isArray(loadedItems) ? loadedItems : []);
      setUsers(Array.isArray(loadedUsers) ? loadedUsers : []);
      setConfig(loadedConfig);
      setFilters((prev) => ({
        ...prev,
        classes:
          prev.classes.length > 0
            ? prev.classes
            : [...(loadedConfig?.classes || [])],
      }));
      return;
    }

    const [loadedItems, loadedUsers] = await Promise.all([
      getItems(),
      getUsers(),
    ]);

    const safeItems = Array.isArray(loadedItems) ? loadedItems : [];
    const fallbackConfig = buildFallbackConfig(safeItems);

    setItems(safeItems);
    setUsers(Array.isArray(loadedUsers) ? loadedUsers : []);
    setConfig(fallbackConfig);
    setFilters((prev) => ({
      ...prev,
      classes:
        prev.classes.length > 0
          ? prev.classes
          : [...(fallbackConfig.classes || [])],
    }));
  }, [isAdmin]);

  useEffect(() => {
    load();
  }, [load]);

  if (!config) {
    return <div className="empty-state">טוען מלאי...</div>;
  }

  const availableItems = items.filter((item) => !item.loanedTo);

  const filtered = availableItems.filter((item) => {
    const query = (filters.search || "").trim().toLowerCase();

    const nameMatch = !query || item.name.toLowerCase().includes(query);

    const classMatch =
      !filters.classes ||
      filters.classes.length === 0 ||
      filters.classes.includes(item.class);

    const typeMatch = !filters.type || item.type === filters.type;

    let fieldMatch = true;

    if (filters.fields) {
      for (const key of Object.keys(filters.fields)) {
        const wanted = (filters.fields[key] || "").toLowerCase().trim();
        const actual = String(item.fields?.[key] || "").toLowerCase();

        if (wanted && !actual.includes(wanted)) {
          fieldMatch = false;
          break;
        }
      }
    }

    return nameMatch && classMatch && typeMatch && fieldMatch;
  });

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">מלאי</h1>
        <div className="page-subtitle">
          צפייה בפריטים הזמינים ובפריטי משנה חסרים בתוך ההיררכיה.
        </div>
      </div>

      <div className="grid-two" style={{ gridTemplateColumns: "360px 1fr" }}>
        <div className="section-stack">
          <Filters config={config} setFilters={setFilters} />
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">פריטים זמינים</h3>
          </div>
          <div className="card-body">
            <ItemTree
              items={filtered}
              allItems={items}
              users={users}
              onEdit={setEditingItem}
            />
          </div>
        </div>
      </div>

      <EditItemModal
        open={!!editingItem}
        item={editingItem}
        items={availableItems}
        users={users}
        config={config}
        role={role}
        onClose={() => setEditingItem(null)}
        onSave={async (id, data) => {
          if (!isAdmin) return;
          await editItem(id, data);
          await load();
          setEditingItem(null);
        }}
        onLoanTree={async (id, userId) => {
          await loanItemWithChildren(id, userId);
          await load();
          setEditingItem(null);
        }}
        onReturnTree={async (id) => {
          await returnItemWithChildren(id);
          await load();
          setEditingItem(null);
        }}
        onRemove={async (id) => {
          if (!isAdmin) return;
          await removeItem(id);
          await load();
          setEditingItem(null);
        }}
      />
    </div>
  );
}