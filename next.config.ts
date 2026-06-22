import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export → bundled into the native app (Capacitor). The app is a client-side
  // SPA that talks to the .NET API at runtime, so no server features are needed.
  output: 'export',
  // Directory-style routes (/dashboard/index.html) resolve cleanly in the Capacitor webview.
  trailingSlash: true,
  // The default image optimizer needs a server; disable it for the static export.
  images: { unoptimized: true },
};

export default nextConfig;
