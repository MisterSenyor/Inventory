const API_BASE =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:5000";

function getStoredToken() {
  return localStorage.getItem("blueshelf_token") || "";
}

function setStoredToken(token) {
  if (token) {
    localStorage.setItem("blueshelf_token", token);
  } else {
    localStorage.removeItem("blueshelf_token");
  }
}

async function apiFetch(url, options = {}) {
  const token = getStoredToken();

  const headers = {
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Request failed");
  }

  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return await res.json();
  }

  return null;
}

export async function login(username, password) {
  const res = await fetch(`${API_BASE}/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Login failed");
  }

  const data = await res.json();
  setStoredToken(data.token || "");
  return data;
}

export async function logout() {
  setStoredToken("");
  return await apiFetch("/api/logout", {
    method: "POST",
  });
}

export async function getMe() {
  return await apiFetch("/api/me");
}

export async function getItems() {
  return await apiFetch("/api/items");
}

export async function getConfig() {
  return await apiFetch("/api/config");
}

export async function uploadImage(file) {
  const token = getStoredToken();
  const formData = new FormData();
  formData.append("image", file);

  const headers = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}/api/upload-image`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Failed to upload image");
  }

  return await res.json();
}

export async function addItem(data) {
  return await apiFetch("/api/items", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function editItem(id, data) {
  return await apiFetch(`/api/items/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function loanItem(id, friend) {
  return await apiFetch("/api/loan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, friend }),
  });
}

export async function loanItemWithChildren(id, friend) {
  return await apiFetch("/api/loan-with-children", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, friend }),
  });
}

export async function returnItem(id) {
  return await apiFetch("/api/return", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });
}

export async function returnItemWithChildren(id) {
  return await apiFetch("/api/return-with-children", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });
}

export async function removeItem(id) {
  return await apiFetch(`/api/items/${id}`, {
    method: "DELETE",
  });
}

export async function addClass(name) {
  return await apiFetch("/api/config/classes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
}

export async function removeClass(name) {
  return await apiFetch(`/api/config/classes/${encodeURIComponent(name)}`, {
    method: "DELETE",
  });
}

export async function addType(name, fields) {
  return await apiFetch("/api/config/types", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, fields }),
  });
}

export async function removeType(name) {
  return await apiFetch(`/api/config/types/${encodeURIComponent(name)}`, {
    method: "DELETE",
  });
}