"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { getRepository } from "@/lib/repository";
import { isIndexedDBAvailable } from "@/lib/db/connection";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { DEFAULT_CATEGORIES } from "@/lib/default-categories";
import { useAuth } from "./auth-provider";
import type {
  Budget,
  BudgetInput,
  Category,
  ExportBundle,
  RecurringExpense,
  RecurringExpenseInput,
  Transaction,
  TransactionInput,
  UserSettings,
} from "@/lib/types";

type Status = "loading" | "ready" | "unavailable" | "error";

interface DataContextValue {
  status: Status;
  errorMessage: string | null;
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  recurringExpenses: RecurringExpense[];
  settings: UserSettings;
  resolvedTheme: "light" | "dark";
  addTransaction: (input: TransactionInput) => Promise<void>;
  updateTransaction: (
    id: string,
    patch: Partial<TransactionInput>,
  ) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  addBudget: (input: BudgetInput) => Promise<void>;
  updateBudget: (id: string, patch: Partial<BudgetInput>) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
  addRecurringExpense: (input: RecurringExpenseInput) => Promise<void>;
  updateRecurringExpense: (
    id: string,
    patch: Partial<RecurringExpenseInput> & { active?: boolean },
  ) => Promise<void>;
  deleteRecurringExpense: (id: string) => Promise<void>;
  updateSettings: (patch: Partial<UserSettings>) => Promise<void>;
  exportData: () => Promise<ExportBundle>;
  importData: (bundle: ExportBundle) => Promise<void>;
  clearAllData: () => Promise<void>;
}

const DataContext = createContext<DataContextValue | null>(null);

function fallbackSettings(userId: string): UserSettings {
  return {
    id: userId,
    currency: "TRY",
    theme: "system",
    onboardingCompleted: false,
    createdAt: new Date(0).toISOString(),
    updatedAt: new Date(0).toISOString(),
  };
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { status: authStatus, user } = useAuth();
  const [status, setStatus] = useState<Status>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [recurringExpenses, setRecurringExpenses] = useState<
    RecurringExpense[]
  >([]);
  const [settings, setSettings] = useState<UserSettings>(() =>
    fallbackSettings(""),
  );
  const [systemPrefersDark, setSystemPrefersDark] = useState(() =>
    typeof window !== "undefined" && window.matchMedia
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
      : false,
  );

  const repo = useMemo(() => getRepository(), []);

  const refresh = useCallback(async () => {
    const [tx, budgetList, recurring, userSettings] = await Promise.all([
      repo.getTransactions(),
      repo.getBudgets(),
      repo.getRecurringExpenses(),
      repo.getSettings(),
    ]);
    setTransactions(tx);
    setBudgets(budgetList);
    setRecurringExpenses(recurring);
    setSettings(userSettings);
  }, [repo]);

  useEffect(() => {
    // DataProvider only ever mounts inside the already-authenticated (app)
    // route tree (see AuthGuard), so this only matters in the narrow window
    // where a session drops out from under a still-mounted page - AuthGuard
    // will redirect to /login and unmount this provider momentarily after.
    if (authStatus !== "authenticated" || !user) return;

    let cancelled = false;
    async function attemptLoad() {
      await repo.init();
      if (cancelled) return;
      await refresh();
    }
    async function boot() {
      if (!isSupabaseConfigured() && !isIndexedDBAvailable()) {
        setStatus("unavailable");
        return;
      }
      try {
        await attemptLoad();
        if (cancelled) return;
        setStatus("ready");
      } catch (err) {
        if (cancelled) return;
        // Supabase occasionally rejects a token that was minted moments ago
        // with "JWT issued at future" - a sub-second clock gap between its
        // Auth and Data-API services, most visible right after sign-up. It
        // clears itself within about a second, so retry once before
        // surfacing an error to the user.
        const message = err instanceof Error ? err.message : "";
        if (/issued.*future/i.test(message)) {
          await new Promise((resolve) => setTimeout(resolve, 1200));
          if (cancelled) return;
          try {
            await attemptLoad();
            if (cancelled) return;
            setStatus("ready");
            return;
          } catch (retryErr) {
            if (cancelled) return;
            console.error("Failed to load finance data (after retry)", retryErr);
            setErrorMessage(
              retryErr instanceof Error ? retryErr.message : "Unknown storage error.",
            );
            setStatus("error");
            return;
          }
        }
        console.error("Failed to load finance data", err);
        setErrorMessage(message || "Unknown storage error.");
        setStatus("error");
      }
    }
    boot();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authStatus, user?.id, repo, refresh]);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => setSystemPrefersDark(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const resolvedTheme: "light" | "dark" = useMemo(() => {
    if (settings.theme === "system") return systemPrefersDark ? "dark" : "light";
    return settings.theme;
  }, [settings.theme, systemPrefersDark]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.classList.toggle("dark", resolvedTheme === "dark");
    document.documentElement.style.colorScheme = resolvedTheme;
  }, [resolvedTheme]);

  useEffect(() => {
    if (typeof window === "undefined" || status !== "ready") return;
    try {
      window.localStorage.setItem("finance-theme", settings.theme);
    } catch {
      // localStorage may be unavailable (private mode); theme still works in-session.
    }
  }, [settings.theme, status]);

  const addTransaction = useCallback(
    async (input: TransactionInput) => {
      const record = await repo.addTransaction(input);
      setTransactions((prev) => [record, ...prev].sort((a, b) => b.date.localeCompare(a.date)));
    },
    [repo],
  );

  const updateTransaction = useCallback(
    async (id: string, patch: Partial<TransactionInput>) => {
      const updated = await repo.updateTransaction(id, patch);
      setTransactions((prev) =>
        prev
          .map((t) => (t.id === id ? updated : t))
          .sort((a, b) => b.date.localeCompare(a.date)),
      );
    },
    [repo],
  );

  const deleteTransaction = useCallback(
    async (id: string) => {
      await repo.deleteTransaction(id);
      setTransactions((prev) => prev.filter((t) => t.id !== id));
    },
    [repo],
  );

  const addBudget = useCallback(
    async (input: BudgetInput) => {
      const record = await repo.addBudget(input);
      setBudgets((prev) => [...prev, record]);
    },
    [repo],
  );

  const updateBudget = useCallback(
    async (id: string, patch: Partial<BudgetInput>) => {
      const updated = await repo.updateBudget(id, patch);
      setBudgets((prev) => prev.map((b) => (b.id === id ? updated : b)));
    },
    [repo],
  );

  const deleteBudget = useCallback(
    async (id: string) => {
      await repo.deleteBudget(id);
      setBudgets((prev) => prev.filter((b) => b.id !== id));
    },
    [repo],
  );

  const addRecurringExpense = useCallback(
    async (input: RecurringExpenseInput) => {
      const record = await repo.addRecurringExpense(input);
      setRecurringExpenses((prev) => [...prev, record]);
    },
    [repo],
  );

  const updateRecurringExpense = useCallback(
    async (
      id: string,
      patch: Partial<RecurringExpenseInput> & { active?: boolean },
    ) => {
      const updated = await repo.updateRecurringExpense(id, patch);
      setRecurringExpenses((prev) =>
        prev.map((r) => (r.id === id ? updated : r)),
      );
    },
    [repo],
  );

  const deleteRecurringExpense = useCallback(
    async (id: string) => {
      await repo.deleteRecurringExpense(id);
      setRecurringExpenses((prev) => prev.filter((r) => r.id !== id));
    },
    [repo],
  );

  const updateSettings = useCallback(
    async (patch: Partial<UserSettings>) => {
      const updated = await repo.updateSettings(patch);
      setSettings(updated);
    },
    [repo],
  );

  const exportData = useCallback(() => repo.exportAll(), [repo]);

  const importData = useCallback(
    async (bundle: ExportBundle) => {
      await repo.importAll(bundle);
      await refresh();
    },
    [repo, refresh],
  );

  const clearAllData = useCallback(async () => {
    await repo.clearAllData();
    await refresh();
  }, [repo, refresh]);

  const value: DataContextValue = {
    status,
    errorMessage,
    transactions,
    categories: DEFAULT_CATEGORIES,
    budgets,
    recurringExpenses,
    settings,
    resolvedTheme,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addBudget,
    updateBudget,
    deleteBudget,
    addRecurringExpense,
    updateRecurringExpense,
    deleteRecurringExpense,
    updateSettings,
    exportData,
    importData,
    clearAllData,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within a DataProvider");
  return ctx;
}
