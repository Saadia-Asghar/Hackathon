import Link from "next/link";

const PAGES = [
  ["/translate", "Translate", "Sign to text and voice"],
  ["/speak", "Speak", "Voice or text to sign"],
  ["/learn", "Learn", "Lessons with camera scoring"],
  ["/dictionary", "Dictionary", "Search any sign"],
  ["/contribute", "Contribute", "Help build the dataset"],
  ["/sos", "SOS", "Emergency phrases, works offline"],
  ["/conversation", "Conversation", "Deaf and hearing person, one screen"],
  ["/kiosk", "Kiosk", "Counter mode for banks and clinics"],
  ["/pricing", "Pricing", "Plans for organisations"],
  ["/document", "Document", "Photo of a letter to simple words and signs"],
  ["/validate", "Validate", "Review community recordings"],
  ["/org", "Dashboard", "Usage and compliance for organisations"],
];

export default function Home() {
  return (
    <main>
      <h1>SignBridge</h1>
      <p className="muted">Offline AI sign-language translator: PSL, SgSL, ASL</p>
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        {PAGES.map(([href, name, desc]) => (
          <Link key={href} href={href} style={{ padding: 20, borderRadius: 14, background: "#18233a", textDecoration: "none" }}>
            <div className="big" style={{ fontSize: "1.4rem" }}>{name}</div>
            <div className="muted">{desc}</div>
          </Link>
        ))}
      </div>
    </main>
  );
}
