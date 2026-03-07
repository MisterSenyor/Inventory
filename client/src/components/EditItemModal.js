import { useEffect, useMemo, useState } from "react";
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
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={fieldDef.label || fieldDef.name}
    />
  );
}

export default function EditItemModal({
  open,
  item,
  items,
  config,
  onClose,
  onSave,
  onLoanTree,
  onReturnTree,
  onRemove,
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [cls, setCls] = useState("");
  const [fields, setFields] = useState({});
  const [parentId, setParentId] = useState(null);
  const [loanUserId, setLoanUserId] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loaning, setLoaning] = useState(false);
  const [returning, setReturning] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!item) {
      return;
    }

    setName(item.name || "");
    setType(item.type || "");
    setCls(item.class || "");
    setFields(item.fields || {});
    setParentId(item.parentId || null);
    setLoanUserId(item.loanedTo || "");
    setImageUrl(item.imageUrl || "");
    setSelectedFile(null);
    setSaving(false);
    setLoaning(false);
    setReturning(false);
    setRemoving(false);
    setError("");
  }, [item]);

  const typeFields = useMemo(() => {
    if (!type || !config?.types?.[type]) {
      return [];
    }
    return config.types[type].fields || [];
  }, [type, config]);

  if (!open || !item) {
    return null;
  }

  const busy = saving || loaning || returning || removing;

  async function handleSave() {
    try {
      setSaving(true);
      setError("");

      let nextImageUrl = imageUrl;

      if (selectedFile) {
        const uploaded = await uploadImage(selectedFile);
        nextImageUrl = uploaded.imageUrl || "";
      }

      await onSave(item.id, {
        name: name.trim(),
        type,
        class: cls,
        fields,
        parentId,
        imageUrl: nextImageUrl,
        loanedTo: item.loanedTo ?? null,
      });
    } catch (err) {
      setError(err.message || "Failed to save item");
      setSaving(false);
    }
  }

  async function handleLoanTree() {
    try {
      setLoaning(true);
      setError("");
      await onLoanTree(item.id, loanUserId.trim());
    } catch (err) {
      setError(err.message || "Failed to loan item tree");
      setLoaning(false);
    }
  }

  async function handleReturnTree() {
    try {
      setReturning(true);
      setError("");
      await onReturnTree(item.id);
    } catch (err) {
      setError(err.message || "Failed to return item tree");
      setReturning(false);
    }
  }

  async function handleRemove() {
    const confirmed = window.confirm(
      `Remove "${item.name}"? Children will remain and become top-level items.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setRemoving(true);
      setError("");
      await onRemove(item.id);
    } catch (err) {
      setError(err.message || "Failed to remove item");
      setRemoving(false);
    }
  }

  return (
    <div
      className="modal-overlay"
      onClick={() => {
        if (!busy) {
          onClose();
        }
      }}
    >
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-title">Edit Item</h3>

        {error && <div className="notice-error">{error}</div>}

        <div className="form-grid">
          <div>
            <label className="label">Name</label>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name"
            />
          </div>

          <div>
            <label className="label">Upload new image</label>
            <input
              className="input"
              type="file"
              accept="image/*"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
            />
          </div>

          <div>
            <label className="label">Type</label>
            <select
              className="select"
              value={type}
              onChange={(e) => {
                setType(e.target.value);
                setFields({});
              }}
            >
              <option value="">Type</option>
              {Object.keys(config.types || {}).map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Class</label>
            <select
              className="select"
              value={cls}
              onChange={(e) => setCls(e.target.value)}
            >
              <option value="">Class</option>
              {(config.classes || []).map((c) => (
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
                setFields((prev) => ({
                  ...prev,
                  [f.name]: nextValue,
                }))
              )}
            </div>
          ))}

          <ParentSelector
            items={items}
            value={parentId}
            onChange={setParentId}
            excludeId={item.id}
          />

          <div className="card" style={{ boxShadow: "none" }}>
            <div className="card-header">
              <h4 className="card-title">Lending</h4>
            </div>
            <div className="card-body form-grid">
              <div>
                <label className="label">User ID</label>
                <input
                  className="input"
                  value={loanUserId}
                  onChange={(e) => setLoanUserId(e.target.value)}
                  placeholder="Enter user ID"
                />
              </div>

              <div className="toolbar">
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={busy || !loanUserId.trim()}
                  onClick={handleLoanTree}
                >
                  {loaning ? "Lending..." : "Lend item + children"}
                </button>

                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={busy}
                  onClick={handleReturnTree}
                >
                  {returning ? "Returning..." : "Return item + children"}
                </button>
              </div>
            </div>
          </div>

          <div
            className="toolbar"
            style={{ justifyContent: "space-between", marginTop: 8 }}
          >
            <button
              type="button"
              className="btn btn-danger"
              disabled={busy}
              onClick={handleRemove}
            >
              {removing ? "Removing..." : "Remove"}
            </button>

            <div className="toolbar">
              <button
                type="button"
                className="btn btn-primary"
                disabled={busy}
                onClick={handleSave}
              >
                {saving ? "Saving..." : "Save"}
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                disabled={busy}
                onClick={onClose}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}