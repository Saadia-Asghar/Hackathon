import "./globals.css";
import type { ReactNode } from "react";

export const metadata = { title: "SignBridge", description: "Offline AI sign-language translator" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
