import Link from "next/link";

export default function Home() {
  return (
    <main>
      <h1>SignBridge</h1>
      <p className="muted">Offline AI sign-language translator: PSL, SgSL, ASL</p>
      <ul>
        <li><Link href="/translate">Translate (sign to voice)</Link></li>
        <li className="muted">Speak (voice to sign): Zakraya</li>
        <li className="muted">Learn: Zakraya</li>
        <li className="muted">Contribute, Validate, SOS: Umaiza</li>
      </ul>
    </main>
  );
}
