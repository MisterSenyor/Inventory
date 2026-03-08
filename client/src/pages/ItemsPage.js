import { useEffect, useState } from "react";
import {
  editItem,
  getConfig,
  getItems,
  loanItemWithChildren,
  removeItem,
  returnItemWithChildren,
} from "../api/api";
import Filters from "../components/Filters";
import ItemTree from "../components/ItemTree";
import EditItemModal from "../components/EditItemModal";

export default function ItemsPage() {
  const [items, setItems] = useState([]);
  const [config, setConfig] = useState(null);
  const [filters, setFilters] = useState({
    search: "",
    classes: [],
    type: "",
    fields: {},
  });
  const [editingItem, setEditingItem] = useState(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const loadedItems = await getItems();
    const loadedConfig = await getConfig();

    setItems(loadedItems);
    setConfig(loadedConfig);
    setFilters((prev) => ({
      ...prev,
      classes:
        prev.classes.length > 0 ? prev.classes : [...(loadedConfig.classes || [])],
    }));
  }

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
              onEdit={setEditingItem}
            />
          </div>
        </div>
      </div>

      <EditItemModal
        open={!!editingItem}
        item={editingItem}
        items={availableItems}
        config={config}
        onClose={() => setEditingItem(null)}
        onSave={async (id, data) => {
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
          await removeItem(id);
          await load();
          setEditingItem(null);
        }}
      />
    </div>
  );
}