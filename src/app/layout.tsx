import type { Metadata, Viewport } from "next";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/instrument-serif/400-italic.css";
import "./globals.css";
import { PwaSupport } from "@/components/pwa-support";
import { MotionProvider } from "@/components/motion";

export const metadata: Metadata = {
  title: { default: "StokvelOS — Good things grow together", template: "%s · StokvelOS" },
  description:
    "A clearer way to manage South African rotating stokvels and burial societies. Contributions, committee decisions and transparent records in one place.",
  applicationName: "StokvelOS",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon.svg", apple: "/icons/apple-touch-icon.png" },
  appleWebApp: { capable: true, statusBarStyle: "default", title: "StokvelOS" },
  formatDetection: { telephone: false },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F7F9FC" },
    { media: "(prefers-color-scheme: dark)", color: "#161F34" },
  ],
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-ZA">
      <body>
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        <MotionProvider>
          <PwaSupport>{children}</PwaSupport>
        </MotionProvider>
      </body>
    </html>
  );
}
