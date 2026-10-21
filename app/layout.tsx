import type { Metadata } from "next";
import "antd/dist/reset.css";
import "../src/index.css";

export const metadata: Metadata = {
  title: "Email Template Editor",
  description: "Visual email template editor",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
