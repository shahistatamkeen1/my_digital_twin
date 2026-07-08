import CareerSidebar from "./components/CareerSidebar";

export default function CareerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <CareerSidebar />
      <main className="ml-64 min-h-screen">{children}</main>
    </div>
  );
}