import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Order Management",
  description: "OutSystems 11 OrderManagement の Next.js + PostgreSQL 移行版",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
