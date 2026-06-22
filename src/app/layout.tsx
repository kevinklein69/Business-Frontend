import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Toaster } from "sonner";
import { Providers } from "./providers";
import "./globals.css";

// Self-hosted Outfit (SIL Open Font License) — no requests to Google at build or runtime.
// Variable font: a single file covers the full 100–900 weight range.
const outfit = localFont({
  src: "./fonts/Outfit-Variable.woff2",
  variable: "--font-outfit",
  weight: "100 900",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Betrieb-App",
  description: "Betriebsverwaltung — Zeiterfassung, Aufträge, Urlaub",
  manifest: "/manifest.json",
};

// viewport-fit=cover lets the app draw under the iOS status bar / notch / home indicator,
// so `env(safe-area-inset-*)` returns real values and our layout can pad around them.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="de"
      className={`${outfit.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
