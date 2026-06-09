import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Windows reserves the default Vite port range (5086-5185 is excluded by
    // WinNAT/Hyper-V on this machine), so we bind to 4000 instead. Forcing the
    // IPv4 host avoids an EACCES error on the ::1 (IPv6 localhost) interface.
    host: "127.0.0.1",
    port: 4000,
  },
});
