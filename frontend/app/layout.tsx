import "./globals.css";

export const metadata = {
  title: "My Digital Twin",
  description: "AI-powered personal digital twin platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-slate-950" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}