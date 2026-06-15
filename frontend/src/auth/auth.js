// =============================================================================
// auth/auth.js — localStorage-backed auth helpers + API calls
// -----------------------------------------------------------------------------
// Single source of truth for "who is logged in". The authenticated user's
// PUBLIC profile (never a password) is persisted in localStorage so the session
// survives page refreshes, per the Phase C requirement.
//
//   login(username, password)  -> POSTs /login, saves user, returns user
//   register(payload)          -> POSTs /register (does NOT auto-login)
//   getCurrentUser()           -> reads the saved user (or null)
//   logout()                   -> clears the saved user
// =============================================================================

import api from "../api/client";

const STORAGE_KEY = "auth_user";

// Read the persisted user object, or null if not logged in / corrupt.
export function getCurrentUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function isAuthenticated() {
  return getCurrentUser() !== null;
}

// Overwrite the saved user (e.g. after editing profile details) so the rest of
// the app sees the updated info immediately.
export function setCurrentUser(user) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

// Verify credentials against the backend. On success the returned user data
// (which contains NO password) is saved to localStorage.
export async function login(username, password) {
  const { data } = await api.post("/login", { username, password });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  return data;
}

// Create a new account. We intentionally do NOT log the user in automatically —
// they are sent to /login to sign in with their new credentials.
export async function register(payload) {
  const { data } = await api.post("/register", payload);
  return data;
}

// Clear the session.
export function logout() {
  localStorage.removeItem(STORAGE_KEY);
}
