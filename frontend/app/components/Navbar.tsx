import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="bg-slate-950 border-b border-slate-800 px-8 py-4 text-white flex justify-between">
      <Link href="/" className="font-bold">
        My Digital Twin
      </Link>

      <div className="flex gap-6 text-sm">
  <Link href="/dashboard">Dashboard</Link>
  <Link href="/profile">Profile</Link>
  <Link href="/resume">Resume</Link>
  <Link href="/job-match">Job Match</Link>
  <Link href="/ats-resume">ATS Resume</Link>
  <Link href="/applications">Applications</Link>
  <Link href="/recommendations">Recommendations</Link>
  <Link href="/chat">Career Chat</Link>
</div>
    </nav>
  );
}