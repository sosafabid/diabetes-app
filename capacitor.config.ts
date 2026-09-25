import type { CapacitorConfig } from "@capacitor/cli";

// ============================================================================
// Capacitor envuelve la app web YA DESPLEGADA en Vercel — no reempaqueta el
// código ni lo sirve localmente desde el dispositivo. La app nativa abre esta
// URL dentro de un WebView nativo. Esto significa:
//   - Todo lo que despliegues en Vercel se refleja en la app nativa
//     automáticamente (no hay que "reconstruir" la app para cada cambio de
//     código — solo para cambios nativos como íconos, permisos, plugins).
//   - Requiere conexión a internet para funcionar (como cualquier app que
//     depende de un backend con sesión por cookie + base de datos).
// ============================================================================
const config: CapacitorConfig = {
  appId: "com.stayaliveilu.app",
  appName: "Stay Alive ILU",
  webDir: "public", // no se usa para servir contenido (ver server.url), pero Capacitor lo requiere igual
  server: {
    // Cambia esto por tu dominio real de producción en Vercel.
    url: "https://diabetes-app-content-manager2.vercel.app",
    cleartext: false,
  },
  ios: {
    contentInset: "automatic",
  },
};

export default config;
