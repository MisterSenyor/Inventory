import { useEffect, useState } from "react";
import { addItem, getConfig, getItems } from "../api/api";
import ItemForm from "../components/ItemForm";

export default function AddItemPage() {
  const [items, setItems] = useState([]);
  const [config, setConfig] = useState(null);
  const [success, setSuccess] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const loadedItems = await getItems();
    const loadedConfig = await getConfig();
    setItems(loadedItems.filter((item) => !item.loanedTo));
    setConfig(loadedConfig);
  }

  if (!config) {
    return <div className="empty-state">טוען טופס הוספה...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">הוספת פריט</h1>
        <div className="page-subtitle">
          יצירת פריט חדש, צירוף תמונה והכנסה להיררכיית הפריטים.
        </div>
      </div>

      {success && (
        <div
          style={{
            marginBottom: 16,
            padding: 12,
            borderRadius: 12,
            background: "#eefcf5",
            color: "#1f8f5f",
            border: "1px solid #cdeedc",
          }}
        >
          {success}
        </div>
      )}

      <div style={{ maxWidth: 640 }}>
        <ItemForm
          config={config}
          items={items}
          onAdd={async (data) => {
            await addItem(data);
            setSuccess("הפריט נוסף בהצלחה.");
            await load();
          }}
        />
      </div>
    </div>
  );
}