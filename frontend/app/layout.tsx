import "./globals.css";
import Sidebar from "./components/Sidebar";

export const metadata = {
  title: "My Digital Twin",
  description: "AI-powered personal career twin",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-slate-950" suppressHydrationWarning>
        <Sidebar />
        <div className="ml-64">{children}</div>
      </body>
    </html>
  );
}