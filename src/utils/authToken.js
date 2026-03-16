export function parseAuthToken(token) {
  if (!token) return null;

  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;

    const payload = parts[1]
      .replace(/-/g, "+")
      .replace(/_/g, "/")
      .padEnd(Math.ceil(parts[1].length / 4) * 4, "=");

    const decoded = JSON.parse(window.atob(payload));
    return decoded && typeof decoded === "object" ? decoded : null;
  } catch {
    return null;
  }
}

export function getAuthUserFromStorage() {
  const token = localStorage.getItem("crm_access_token");
  return parseAuthToken(token);
}
