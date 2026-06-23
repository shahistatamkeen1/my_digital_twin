import Sidebar from "../components/Sidebar";

export default function CareerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Sidebar />
      <div className="ml-64 min-h-screen">
        {children}
      </div>
    </div>
  );
}