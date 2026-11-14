import "./globals.css";
import Link from "next/link";
import type { ReactNode } from "react";
import RegisterSW from "@/components/RegisterSW";

export const metadata = {
  title: "SignBridge",
  description: "Offline AI sign-language translator",
  manifest: "/manifest.json",
};

const NAV = [
  ["/", "Home"], ["/translate", "Translate"], ["/conversation", "Conversation"], ["/speak", "Speak"],
  ["/learn", "Learn"], ["/dictionary", "Dictionary"], ["/sos", "SOS"], ["/about", "About"],
];

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <nav className="row" style={{ padding: "10px 16px", gap: 14, borderBottom: "1px solid #223", overflowX: "auto" }}>
          {NAV.map(([href, name]) => <Link key={href} href={href}>{name}</Link>)}
        </nav>
        {children}
        <RegisterSW />
      </body>
    </html>
  );
}
