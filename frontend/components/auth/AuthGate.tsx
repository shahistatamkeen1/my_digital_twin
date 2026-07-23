"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAuth } from "./AuthProvider";

const PUBLIC_ROUTES = new Set(["/", "/login", "/register"]);

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { status } = useAuth();

  const isPublicRoute = PUBLIC_ROUTES.has(pathname);

  useEffect(() => {
    if (!isPublicRoute && status === "unauthenticated") {
      const next = `${window.location.pathname}${window.location.search}`;
      router.replace(`/login?next=${encodeURIComponent(next)}`);
    }
  }, [isPublicRoute, pathname, router, status]);

  if (isPublicRoute) {
    return children;
  }

  if (status !== "authenticated") {
    return <AuthenticationLoadingScreen />;
  }

  return children;
}

function AuthenticationLoadingScreen() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#020617] px-6 text-white">
      <div className="text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-cyan-500/20 border-t-cyan-400" />
        <p className="mt-4 text-sm text-slate-400">
          Verifying your secure session...
        </p>
      </div>
    </main>
  );
}
