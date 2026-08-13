"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useAuth } from "@/components/auth/AuthProvider";
import { listApprovals } from "@/lib/approvals";

type ApprovalContextValue = {
  pendingCount: number;
  loading: boolean;
  refreshPendingCount: () => Promise<void>;
};

const ApprovalContext = createContext<ApprovalContextValue | undefined>(undefined);

export function ApprovalProvider({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const refreshPendingCount = useCallback(async () => {
    if (status !== "authenticated") {
      setPendingCount(0);
      return;
    }

    setLoading(true);
    try {
      const result = await listApprovals({
        status: "pending",
        page: 1,
        pageSize: 1,
      });
      setPendingCount(result.pagination.total_items);
    } catch {
      // The inbox surfaces request errors; navigation badges fail quietly.
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    const initialTimer = window.setTimeout(() => {
      void refreshPendingCount();
    }, 0);

    if (status !== "authenticated") {
      return () => window.clearTimeout(initialTimer);
    }

    const timer = window.setInterval(() => {
      void refreshPendingCount();
    }, 30_000);

    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(timer);
    };
  }, [refreshPendingCount, status]);

  const value = useMemo(
    () => ({ pendingCount, loading, refreshPendingCount }),
    [loading, pendingCount, refreshPendingCount]
  );

  return (
    <ApprovalContext.Provider value={value}>
      {children}
    </ApprovalContext.Provider>
  );
}

export function useApprovals(): ApprovalContextValue {
  const context = useContext(ApprovalContext);
  if (!context) {
    throw new Error("useApprovals must be used inside ApprovalProvider.");
  }
  return context;
}
