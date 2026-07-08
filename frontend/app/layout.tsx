import "./globals.css";

export const metadata = {
  title: "My Digital Twin",
  description: "AI-powered personal digital twin",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}