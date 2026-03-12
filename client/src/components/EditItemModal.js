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
        <option value="">בחר</option>
        <option value="true">כן</option>
        <option value="false">לא</option>
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

function getUserDisplay(user) {
  const phone = user.phoneNumber ? ` · ${user.phoneNumber}` : "";
  return `${user.name} (${user.id})${phone}`;
}

export default function EditItemModal({
  open,
  item,
  items,
  users = [],
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

  const selectedUser = useMemo(() => {
    return users.find((user) => String(user.id) === String(loanUserId)) || null;
  }, [users, loanUserId]);

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
      setError(err.message || "שמירת הפריט נכשלה");
      setSaving(false);
    }
  }

  async function handleLoanTree() {
    try {
      setLoaning(true);
      setError("");
      await onLoanTree(item.id, loanUserId.trim());
    } catch (err) {
      setError(err.message || "השאלת הפריט נכשלה");
      setLoaning(false);
    }
  }

  async function handleReturnTree() {
    try {
      setReturning(true);
      setError("");
      await onReturnTree(item.id);
    } catch (err) {
      setError(err.message || "החזרת הפריט נכשלה");
      setReturning(false);
    }
  }

  async function handleRemove() {
    const confirmed = window.confirm(
      `למחוק את "${item.name}"? פריטי הילדים יישארו ויהפכו לפריטי שורש.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setRemoving(true);
      setError("");
      await onRemove(item.id);
    } catch (err) {
      setError(err.message || "מחיקת הפריט נכשלה");
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
        <h3 className="modal-title">עריכת פריט</h3>

        {error && <div className="notice-error">{error}</div>}

        <div className="form-grid">
          <div>
            <label className="label">שם</label>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="שם"
            />
          </div>

          <div>
            <label className="label">העלאת תמונה חדשה</label>
            <input
              className="input"
              type="file"
              accept="image/*"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
            />
          </div>

          <div>
            <label className="label">סוג</label>
            <select
              className="select"
              value={type}
              onChange={(e) => {
                setType(e.target.value);
                setFields({});
              }}
            >
              <option value="">בחר סוג</option>
              {Object.keys(config.types || {}).map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">קטגוריה</label>
            <select
              className="select"
              value={cls}
              onChange={(e) => setCls(e.target.value)}
            >
              <option value="">בחר קטגוריה</option>
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
              <h4 className="card-title">השאלה</h4>
            </div>
            <div className="card-body form-grid">
              <div>
                <label className="label">בחר שואל</label>
                <select
                  className="select"
                  value={loanUserId}
                  onChange={(e) => setLoanUserId(e.target.value)}
                >
                  <option value="">בחר משתמש</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {getUserDisplay(user)}
                    </option>
                  ))}
                </select>
              </div>

              {selectedUser && (
                <div className="field-row">
                  <strong>נבחר:</strong>
                  <span>{getUserDisplay(selectedUser)}</span>
                </div>
              )}

              <div className="toolbar">
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={busy || !loanUserId.trim()}
                  onClick={handleLoanTree}
                >
                  {loaning ? "משאיל..." : "השאל פריט + ילדים"}
                </button>

                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={busy}
                  onClick={handleReturnTree}
                >
                  {returning ? "מחזיר..." : "החזר פריט + ילדים"}
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
              {removing ? "מוחק..." : "מחק"}
            </button>

            <div className="toolbar">
              <button
                type="button"
                className="btn btn-primary"
                disabled={busy}
                onClick={handleSave}
              >
                {saving ? "שומר..." : "שמור"}
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                disabled={busy}
                onClick={onClose}
              >
                ביטול
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}