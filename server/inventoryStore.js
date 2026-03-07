const fs = require("fs");
const path = require("path");

const inventoryPath = path.join(__dirname, "inventory.json");
const configPath = path.join(__dirname, "config.json");
const uploadsDir = path.join(__dirname, "uploads");

function readJSON(filePath, fallback) {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(fallback, null, 2));
    return fallback;
  }

  const raw = fs.readFileSync(filePath, "utf8");
  if (!raw.trim()) {
    fs.writeFileSync(filePath, JSON.stringify(fallback, null, 2));
    return fallback;
  }

  return JSON.parse(raw);
}

function writeJSON(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function getItems() {
  return readJSON(inventoryPath, []);
}

function saveItems(items) {
  writeJSON(inventoryPath, items);
}

function getConfig() {
  return readJSON(configPath, { classes: [], types: {} });
}

function saveConfig(config) {
  writeJSON(configPath, config);
}

function generateId(items) {
  let maxId = 0;

  for (const item of items) {
    const num = Number(item.id);
    if (!Number.isNaN(num) && num > maxId) {
      maxId = num;
    }
  }

  return String(maxId + 1);
}

function isManagedUpload(imageUrl) {
  return typeof imageUrl === "string" && imageUrl.startsWith("/uploads/");
}

function imageUrlToPath(imageUrl) {
  if (!isManagedUpload(imageUrl)) {
    return null;
  }

  const fileName = path.basename(imageUrl);
  return path.join(uploadsDir, fileName);
}

function deleteManagedImageIfUnused(imageUrl, items, ignoreItemId = null) {
  if (!isManagedUpload(imageUrl)) {
    return;
  }

  const stillUsed = items.some((item) => {
    if (ignoreItemId !== null && String(item.id) === String(ignoreItemId)) {
      return false;
    }
    return item.imageUrl === imageUrl;
  });

  if (stillUsed) {
    return;
  }

  const fullPath = imageUrlToPath(imageUrl);
  if (fullPath && fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
  }
}

function addItem(data) {
  const items = getItems();

  const newItem = {
    id: generateId(items),
    name: data.name || "",
    type: data.type || "",
    class: data.class || "",
    fields: data.fields || {},
    parentId: data.parentId || null,
    loanedTo: data.loanedTo || null,
    imageUrl: data.imageUrl || "",
  };

  items.push(newItem);
  saveItems(items);
  return newItem;
}

function editItem(id, updates) {
  const items = getItems();
  const index = items.findIndex((item) => String(item.id) === String(id));

  if (index === -1) {
    throw new Error(`Item with id ${id} not found`);
  }

  const current = items[index];

  let nextParentId = current.parentId;
  if (Object.prototype.hasOwnProperty.call(updates, "parentId")) {
    nextParentId =
      updates.parentId === "" || updates.parentId === null
        ? null
        : String(updates.parentId);
  }

  const nextImageUrl =
    updates.imageUrl === undefined ? current.imageUrl : updates.imageUrl;

  items[index] = {
    ...current,
    name: updates.name ?? current.name,
    type: updates.type ?? current.type,
    class: updates.class ?? current.class,
    fields: updates.fields ?? current.fields,
    parentId: nextParentId,
    imageUrl: nextImageUrl,
    loanedTo:
      updates.loanedTo === undefined ? current.loanedTo : updates.loanedTo,
  };

  if (current.imageUrl !== nextImageUrl) {
    deleteManagedImageIfUnused(current.imageUrl, items, current.id);
  }

  saveItems(items);
  return items[index];
}

function removeItem(id) {
  const items = getItems();
  const itemToRemove = items.find((item) => String(item.id) === String(id));

  if (!itemToRemove) {
    throw new Error(`Item with id ${id} not found`);
  }

  const filtered = items
    .filter((item) => String(item.id) !== String(id))
    .map((item) => ({
      ...item,
      parentId: String(item.parentId) === String(id) ? null : item.parentId,
    }));

  deleteManagedImageIfUnused(itemToRemove.imageUrl, filtered, id);

  saveItems(filtered);
}

function getDescendantIds(items, rootId) {
  const result = [];
  const stack = [String(rootId)];

  while (stack.length > 0) {
    const currentId = stack.pop();
    result.push(currentId);

    for (const item of items) {
      if (String(item.parentId) === String(currentId)) {
        stack.push(String(item.id));
      }
    }
  }

  return result;
}

function loanItem(id, friend) {
  const items = getItems();
  const item = items.find((x) => String(x.id) === String(id));

  if (!item) {
    throw new Error(`Item with id ${id} not found`);
  }

  item.loanedTo = friend || "";
  saveItems(items);
}

function loanItemWithChildren(id, friend) {
  const items = getItems();
  const ids = new Set(getDescendantIds(items, id));

  let found = false;

  for (const item of items) {
    if (ids.has(String(item.id))) {
      found = true;

      if (!item.loanedTo) {
        item.loanedTo = friend || "";
      }
    }
  }

  if (!found) {
    throw new Error(`Item with id ${id} not found`);
  }

  saveItems(items);
}

function returnItem(id) {
  const items = getItems();
  const item = items.find((x) => String(x.id) === String(id));

  if (!item) {
    throw new Error(`Item with id ${id} not found`);
  }

  item.loanedTo = null;
  saveItems(items);
}

function returnItemWithChildren(id) {
  const items = getItems();
  const ids = new Set(getDescendantIds(items, id));

  let found = false;

  for (const item of items) {
    if (ids.has(String(item.id))) {
      item.loanedTo = null;
      found = true;
    }
  }

  if (!found) {
    throw new Error(`Item with id ${id} not found`);
  }

  saveItems(items);
}

function addClass(className) {
  const config = getConfig();
  const trimmed = String(className || "").trim();

  if (!trimmed) {
    throw new Error("Class name is required");
  }

  if (config.classes.includes(trimmed)) {
    throw new Error("Class already exists");
  }

  config.classes.push(trimmed);
  config.classes.sort((a, b) => a.localeCompare(b));
  saveConfig(config);
  return config;
}

function removeClass(className) {
  const config = getConfig();
  config.classes = config.classes.filter((c) => c !== className);
  saveConfig(config);
  return config;
}

function addType(typeName, fields) {
  const config = getConfig();
  const trimmed = String(typeName || "").trim();

  if (!trimmed) {
    throw new Error("Type name is required");
  }

  if (config.types[trimmed]) {
    throw new Error("Type already exists");
  }

  const normalizedFields = (fields || []).map((field) => ({
    name: String(field.name || "").trim(),
    label: String(field.label || field.name || "").trim(),
    type: String(field.type || "text").trim(),
  }));

  for (const field of normalizedFields) {
    if (!field.name) {
      throw new Error("Each field must have a name");
    }
  }

  config.types[trimmed] = { fields: normalizedFields };
  saveConfig(config);
  return config;
}

function removeType(typeName) {
  const config = getConfig();
  delete config.types[typeName];
  saveConfig(config);
  return config;
}

module.exports = {
  getItems,
  addItem,
  editItem,
  removeItem,
  loanItem,
  loanItemWithChildren,
  returnItem,
  returnItemWithChildren,
  getConfig,
  addClass,
  removeClass,
  addType,
  removeType,
};