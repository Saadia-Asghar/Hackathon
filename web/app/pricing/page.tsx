// D5: Pricing (display only; payments later in Stripe test mode).
const PLANS = [
  { name: "Free", price: "$0", who: "Deaf and hard-of-hearing users", items: ["Translate, Speak, SOS", "Dictionary", "Offline mode", "Always free"] },
  { name: "Learner Pro", price: "$4/mo", who: "Families, students, teachers", items: ["All lessons and tracks", "Certificates", "Progress sync"] },
  { name: "Business", price: "$99/location/mo", who: "Banks, clinics, shops, airports", items: ["Kiosk mode", "Teams plugin", "Staff training", "Compliance reports"] },
  { name: "Enterprise / Government", price: "Contact us", who: "Hospitals, ministries, NGOs", items: ["Developer API", "Private / on-premise models", "Custom sign languages", "SLA"] },
];

export default function PricingPage() {
  return (
    <main>
      <h1>Pricing</h1>
      <p className="muted">Free forever for deaf users. Organisations pay.</p>
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))" }}>
        {PLANS.map((p) => (
          <div key={p.name} style={{ padding: 20, borderRadius: 14, background: "#18233a" }}>
            <h2 style={{ margin: 0 }}>{p.name}</h2>
            <p className="big" style={{ fontSize: "1.5rem" }}>{p.price}</p>
            <p className="muted">{p.who}</p>
            <ul>{p.items.map((i) => <li key={i}>{i}</li>)}</ul>
          </div>
        ))}
      </div>
    </main>
  );
}
