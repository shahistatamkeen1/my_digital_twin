import FinanceSidebar from "./components/FinanceSidebar";

export default function FinanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <FinanceSidebar />
      <div className="ml-64 min-h-screen">
        {children}
      </div>
    </div>
  );
}