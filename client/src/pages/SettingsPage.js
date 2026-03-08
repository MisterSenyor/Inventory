import { useEffect, useState } from "react";
import {
  addClass,
  addType,
  getConfig,
  removeClass,
  removeType,
} from "../api/api";

const FIELD_TYPE_OPTIONS = ["text", "number", "date", "boolean"];

const FIELD_TYPE_LABELS = {
  text: "טקסט",
  number: "מספר",
  date: "תאריך",
  boolean: "בוליאני",
};

export default function SettingsPage() {
  const [config, setConfig] = useState(null);
  const [className, setClassName] = useState("");
  const [typeName, setTypeName] = useState("");
  const [fields, setFields] = useState([
    { name: "", label: "", type: "text" },
  ]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const loaded = await getConfig();
      setConfig(loaded);
      setError("");
    } catch (err) {
      setError(err.message || "טעינת ההגדרות נכשלה");
    }
  }

  async function handleAddClass() {
    if (!className.trim()) {
      return;
    }

    try {
      setBusy(true);
      const updated = await addClass(className.trim());
      setConfig(updated);
      setClassName("");
      setError("");
    } catch (err) {
      setError(err.message || "הוספת הקטגוריה נכשלה");
    } finally {
      setBusy(false);
    }
  }

  async function handleRemoveClass(name) {
    try {
      setBusy(true);
      const updated = await removeClass(name);
      setConfig(updated);
      setError("");
    } catch (err) {
      setError(err.message || "מחיקת הקטגוריה נכשלה");
    } finally {
      setBusy(false);
    }
  }

  function updateField(index, key, value) {
    setFields((prev) =>
      prev.map((field, i) =>
        i === index ? { ...field, [key]: value } : field
      )
    );
  }

  function addFieldRow() {
    setFields((prev) => [...prev, { name: "", label: "", type: "text" }]);
  }

  function removeFieldRow(index) {
    setFields((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleAddType() {
    if (!typeName.trim()) {
      return;
    }

    const cleanedFields = fields
      .map((field) => ({
        name: field.name.trim(),
        label: field.label.trim() || field.name.trim(),
        type: field.type || "text",
      }))
      .filter((field) => field.name);

    try {
      setBusy(true);
      const updated = await addType(typeName.trim(), cleanedFields);
      setConfig(updated);
      setTypeName("");
      setFields([{ name: "", label: "", type: "text" }]);
      setError("");
    } catch (err) {
      setError(err.message || "הוספת הסוג נכשלה");
    } finally {
      setBusy(false);
    }
  }

  async function handleRemoveType(name) {
    try {
      setBusy(true);
      const updated = await removeType(name);
      setConfig(updated);
      setError("");
    } catch (err) {
      setError(err.message || "מחיקת הסוג נכשלה");
    } finally {
      setBusy(false);
    }
  }

  if (!config) {
    return <div className="empty-state">טוען הגדרות...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">הגדרות</h1>
        <div className="page-subtitle">
          ניהול קטגוריות וסוגי פריטים עם שדות מותאמים אישית.
        </div>
      </div>

      {error && <div className="notice-error">{error}</div>}

      <div className="grid-two">
        <div className="section-stack">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">קטגוריות</h3>
            </div>
            <div className="card-body form-grid">
              <div>
                <label className="label">שם קטגוריה חדשה</label>
                <input
                  className="input"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  placeholder="למשל: אישי, משרד, אלקטרוניקה"
                />
              </div>

              <div>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={busy}
                  onClick={handleAddClass}
                >
                  הוסף קטגוריה
                </button>
              </div>

              <div className="field-list">
                {config.classes.length === 0 ? (
                  <div className="empty-state">עדיין אין קטגוריות.</div>
                ) : (
                  config.classes.map((cls) => (
                    <div
                      key={cls}
                      className="tree-node"
                      style={{ boxShadow: "none" }}
                    >
                      <div className="tree-node-inner">
                        <div className="tree-node-top">
                          <div className="tree-node-name">{cls}</div>
                          <button
                            type="button"
                            className="btn btn-danger btn-small"
                            disabled={busy}
                            onClick={() => handleRemoveClass(cls)}
                          >
                            מחק
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="card-title">סוגי פריטים</h3>
            </div>
            <div className="card-body form-grid">
              <div>
                <label className="label">שם סוג חדש</label>
                <input
                  className="input"
                  value={typeName}
                  onChange={(e) => setTypeName(e.target.value)}
                  placeholder="למשל: מחשב נייד, ספר, מצלמה"
                />
              </div>

              <div>
                <label className="label">שדות מותאמים אישית</label>
                <div className="section-stack">
                  {fields.map((field, index) => (
                    <div
                      key={index}
                      className="card"
                      style={{ boxShadow: "none", background: "var(--surface-2)" }}
                    >
                      <div className="card-body">
                        <div className="form-grid">
                          <div>
                            <label className="label">שם שדה פנימי</label>
                            <input
                              className="input"
                              value={field.name}
                              onChange={(e) =>
                                updateField(index, "name", e.target.value)
                              }
                              placeholder="serialNumber"
                            />
                          </div>

                          <div>
                            <label className="label">תווית שדה</label>
                            <input
                              className="input"
                              value={field.label}
                              onChange={(e) =>
                                updateField(index, "label", e.target.value)
                              }
                              placeholder="מספר סידורי"
                            />
                          </div>

                          <div>
                            <label className="label">סוג שדה</label>
                            <select
                              className="select"
                              value={field.type}
                              onChange={(e) =>
                                updateField(index, "type", e.target.value)
                              }
                            >
                              {FIELD_TYPE_OPTIONS.map((option) => (
                                <option key={option} value={option}>
                                  {FIELD_TYPE_LABELS[option]}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <button
                              type="button"
                              className="btn btn-danger btn-small"
                              onClick={() => removeFieldRow(index)}
                              disabled={busy || fields.length === 1}
                            >
                              מחק שדה
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="toolbar">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={addFieldRow}
                      disabled={busy}
                    >
                      הוסף שדה נוסף
                    </button>

                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleAddType}
                      disabled={busy}
                    >
                      הוסף סוג
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="section-stack">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">סוגים קיימים</h3>
            </div>
            <div className="card-body">
              {Object.keys(config.types).length === 0 ? (
                <div className="empty-state">עדיין אין סוגים.</div>
              ) : (
                <div className="section-stack">
                  {Object.entries(config.types).map(([typeName, typeDef]) => (
                    <div key={typeName} className="tree-node" style={{ boxShadow: "none" }}>
                      <div className="tree-node-inner">
                        <div className="tree-node-top">
                          <div>
                            <div className="tree-node-name">{typeName}</div>
                            <div className="page-subtitle" style={{ marginTop: 6 }}>
                              {(typeDef.fields || []).length} שדות מותאמים אישית
                            </div>
                          </div>

                          <button
                            type="button"
                            className="btn btn-danger btn-small"
                            disabled={busy}
                            onClick={() => handleRemoveType(typeName)}
                          >
                            מחק
                          </button>
                        </div>

                        <div className="field-list">
                          {(typeDef.fields || []).length === 0 ? (
                            <div className="field-row">
                              <span>אין שדות מותאמים אישית.</span>
                            </div>
                          ) : (
                            typeDef.fields.map((field) => (
                              <div key={field.name} className="field-row">
                                <strong>{field.label || field.name}</strong>
                                <span>שם: {field.name}</span>
                                <span>סוג: {FIELD_TYPE_LABELS[field.type] || field.type}</span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}