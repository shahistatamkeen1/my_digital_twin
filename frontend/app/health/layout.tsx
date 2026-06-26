import HealthSidebar from "./components/HealthSidebar";

export default function HealthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <HealthSidebar />
      <div className="ml-64 min-h-screen">{children}</div>
    </div>
  );
}