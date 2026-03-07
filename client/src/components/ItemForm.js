import { useMemo, useState } from "react";
import { uploadImage } from "../api/api";
import ParentSelector from "./ParentSelector";

function renderFieldInput(fieldDef, value, onChange) {
  const fieldType = fieldDef.type || "text";

  if (fieldType === "boolean") {
    return (
      <select
        className="select"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Select</option>
        <option value="true">True</option>
        <option value="false">False</option>
      </select>
    );
  }

  return (
    <input
      className="input"
      type={fieldType === "number" ? "number" : fieldType === "date" ? "date" : "text"}
      placeholder={fieldDef.label || fieldDef.name}
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

export default function ItemForm({ config, items, onAdd }) {
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [cls, setCls] = useState("");
  const [fields, setFields] = useState({});
  const [parentId, setParentId] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [adding, setAdding] = useState(false);

  const typeFields = useMemo(() => {
    if (!type || !config.types[type]) {
      return [];
    }
    return config.types[type].fields || [];
  }, [type, config]);

  async function handleAdd() {
    if (!name.trim()) {
      return;
    }

    try {
      setAdding(true);

      let imageUrl = "";
      if (selectedFile) {
        const uploaded = await uploadImage(selectedFile);
        imageUrl = uploaded.imageUrl || "";
      }

      await onAdd({
        name: name.trim(),
        type,
        class: cls,
        fields,
        parentId,
        imageUrl,
      });

      setName("");
      setType("");
      setCls("");
      setFields({});
      setParentId(null);
      setSelectedFile(null);
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Add New Item</h3>
      </div>

      <div className="card-body form-grid">
        <div>
          <label className="label">Item name</label>
          <input
            className="input"
            placeholder="Enter item name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div>
          <label className="label">Upload image</label>
          <input
            className="input"
            type="file"
            accept="image/*"
            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
          />
        </div>

        <div>
          <label className="label">Item type</label>
          <select
            className="select"
            value={type}
            onChange={(e) => {
              setType(e.target.value);
              setFields({});
            }}
          >
            <option value="">Select type</option>
            {Object.keys(config.types).map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Item class</label>
          <select
            className="select"
            value={cls}
            onChange={(e) => setCls(e.target.value)}
          >
            <option value="">Select class</option>
            {config.classes.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {typeFields.map((f) => (
          <div key={f.name}>
            <label className="label">{f.label || f.name}</label>
            {renderFieldInput(f, fields[f.name], (nextValue) =>
              setFields((prev) => ({ ...prev, [f.name]: nextValue }))
            )}
          </div>
        ))}

        <ParentSelector items={items} value={parentId} onChange={setParentId} />

        <div>
          <button
            className="btn btn-primary"
            type="button"
            onClick={handleAdd}
            disabled={adding}
          >
            {adding ? "Adding..." : "Add Item"}
          </button>
        </div>
      </div>
    </div>
  );
}