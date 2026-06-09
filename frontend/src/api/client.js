// =============================================================================
// api/client.js — shared axios instance
// -----------------------------------------------------------------------------
// One pre-configured axios client pointed at the Express backend. Centralizing
// the baseURL here means components never hard-code the server address; it
// comes from VITE_API_URL (.env), defaulting to localhost:3000.
// =============================================================================

import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
  headers: { "Content-Type": "application/json" },
});

export default api;
