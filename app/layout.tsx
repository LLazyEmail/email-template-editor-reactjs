import type { Metadata } from "next";
import "antd/dist/reset.css";
import "../src/index.css";

// The Content-Security-Policy nonce (proxy.ts) differs per request, so pages can't be
// prerendered at build time: a static page would carry no nonce and its scripts would be blocked.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Email Template Editor",
  description: "Visual email template editor",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      {/* Browser extensions (e.g. Grammarly) add attributes to <body> before React hydrates.
          This only ignores attribute mismatches on <body> itself, not on its children. */}
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
