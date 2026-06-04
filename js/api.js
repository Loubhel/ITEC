/** Shared fetch helpers for the XML-backed Flask API */
const API_BASE = "/api";

async function apiRequest(path, options = {}) {
    const config = {
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", ...(options.headers || {}) },
        ...options,
    };

    if (config.body && typeof config.body === "object") {
        config.body = JSON.stringify(config.body);
    }

    const response = await fetch(`${API_BASE}${path}`, config);
    let data = null;

    try {
        data = await response.json();
    } catch {
        data = null;
    }

    if (!response.ok) {
        const message = (data && data.error) || response.statusText || "Request failed";
        throw new Error(message);
    }

    return data;
}

const api = {
    get: (path) => apiRequest(path),
    post: (path, body) => apiRequest(path, { method: "POST", body }),
    put: (path, body) => apiRequest(path, { method: "PUT", body }),
    delete: (path) => apiRequest(path, { method: "DELETE" }),
};