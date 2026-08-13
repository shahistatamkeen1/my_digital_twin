import type { Metadata } from "next";

import "./globals.css";

import AuthGate from "@/components/auth/AuthGate";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { ApprovalProvider } from "@/components/approvals/ApprovalProvider";

export const metadata: Metadata = {
  title: "My Digital Twin",
  description: "AI-powered personal digital twin",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <AuthProvider>
          <ApprovalProvider>
            <AuthGate>{children}</AuthGate>
          </ApprovalProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
