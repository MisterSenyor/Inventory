import { useEffect, useState } from "react";
import {
  addClass,
  addType,
  getConfig,
  removeClass,
  removeType,
} from "../api/api";

const FIELD_TYPE_OPTIONS = ["text", "number", "date", "boolean"];

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
      setError(err.message || "Failed to load settings");
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
      setError(err.message || "Failed to add class");
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
      setError(err.message || "Failed to remove class");
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
      setError(err.message || "Failed to add type");
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
      setError(err.message || "Failed to remove type");
    } finally {
      setBusy(false);
    }
  }

  if (!config) {
    return <div className="empty-state">Loading settings...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <div className="page-subtitle">
          Manage item classes and item types with custom fields.
        </div>
      </div>

      {error && <div className="notice-error">{error}</div>}

      <div className="grid-two">
        <div className="section-stack">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Classes</h3>
            </div>
            <div className="card-body form-grid">
              <div>
                <label className="label">New class name</label>
                <input
                  className="input"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  placeholder="Example: Personal, Office, Electronics"
                />
              </div>

              <div>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={busy}
                  onClick={handleAddClass}
                >
                  Add Class
                </button>
              </div>

              <div className="field-list">
                {config.classes.length === 0 ? (
                  <div className="empty-state">No classes defined yet.</div>
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
                            Remove
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
              <h3 className="card-title">Types</h3>
            </div>
            <div className="card-body form-grid">
              <div>
                <label className="label">New type name</label>
                <input
                  className="input"
                  value={typeName}
                  onChange={(e) => setTypeName(e.target.value)}
                  placeholder="Example: Laptop, Book, Camera"
                />
              </div>

              <div>
                <label className="label">Custom fields</label>
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
                            <label className="label">Field name</label>
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
                            <label className="label">Field label</label>
                            <input
                              className="input"
                              value={field.label}
                              onChange={(e) =>
                                updateField(index, "label", e.target.value)
                              }
                              placeholder="Serial Number"
                            />
                          </div>

                          <div>
                            <label className="label">Field type</label>
                            <select
                              className="select"
                              value={field.type}
                              onChange={(e) =>
                                updateField(index, "type", e.target.value)
                              }
                            >
                              {FIELD_TYPE_OPTIONS.map((option) => (
                                <option key={option} value={option}>
                                  {option}
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
                              Remove Field
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
                      Add Another Field
                    </button>

                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleAddType}
                      disabled={busy}
                    >
                      Add Type
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
              <h3 className="card-title">Existing Types</h3>
            </div>
            <div className="card-body">
              {Object.keys(config.types).length === 0 ? (
                <div className="empty-state">No types defined yet.</div>
              ) : (
                <div className="section-stack">
                  {Object.entries(config.types).map(([typeName, typeDef]) => (
                    <div key={typeName} className="tree-node" style={{ boxShadow: "none" }}>
                      <div className="tree-node-inner">
                        <div className="tree-node-top">
                          <div>
                            <div className="tree-node-name">{typeName}</div>
                            <div className="page-subtitle" style={{ marginTop: 6 }}>
                              {(typeDef.fields || []).length} custom field
                              {(typeDef.fields || []).length === 1 ? "" : "s"}
                            </div>
                          </div>

                          <button
                            type="button"
                            className="btn btn-danger btn-small"
                            disabled={busy}
                            onClick={() => handleRemoveType(typeName)}
                          >
                            Remove
                          </button>
                        </div>

                        <div className="field-list">
                          {(typeDef.fields || []).length === 0 ? (
                            <div className="field-row">
                              <span>No custom fields.</span>
                            </div>
                          ) : (
                            typeDef.fields.map((field) => (
                              <div key={field.name} className="field-row">
                                <strong>{field.label || field.name}</strong>
                                <span>name: {field.name}</span>
                                <span>type: {field.type || "text"}</span>
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