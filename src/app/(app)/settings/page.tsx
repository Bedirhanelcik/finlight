"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Download,
  KeyRound,
  Laptop,
  LogOut,
  Moon,
  Sun,
  Trash2,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { SegmentedControl } from "@/components/settings/segmented-control";
import { ChangePasswordModal } from "@/components/settings/change-password-modal";
import { useAuth } from "@/context/auth-provider";
import { useData } from "@/context/data-provider";
import { useToast } from "@/context/toast-provider";
import { CURRENCY_META } from "@/lib/currency";
import { downloadJson, readFileAsText } from "@/lib/download";
import { SUPPORTED_CURRENCIES, type CurrencyCode, type ThemePreference } from "@/lib/types";
import { validateExportBundle } from "@/lib/validation";

type DialogKind = "clear" | "import" | "password" | null;

export default function SettingsPage() {
  const { settings, updateSettings, exportData, importData, clearAllData } = useData();
  const { user, signOut } = useAuth();
  const router = useRouter();
  const { show } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dialog, setDialog] = useState<DialogKind>(null);
  const [busy, setBusy] = useState(false);
  const [pendingImport, setPendingImport] = useState<unknown | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  async function handleExport() {
    try {
      const bundle = await exportData();
      const date = new Date().toISOString().slice(0, 10);
      downloadJson(bundle, `finlight-export-${date}.json`);
      show("Data exported.");
    } catch {
      show("Export failed. Try again.", "error");
    }
  }

  function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    readFileAsText(file)
      .then((text) => {
        const parsed = JSON.parse(text);
        const result = validateExportBundle(parsed);
        if (!result.valid) {
          setImportError(result.errors.join(" "));
          setPendingImport(null);
        } else {
          setImportError(null);
          setPendingImport(result.data);
        }
        setDialog("import");
      })
      .catch(() => {
        setImportError("This file isn't valid JSON.");
        setPendingImport(null);
        setDialog("import");
      });
  }

  async function confirmImport() {
    if (!pendingImport) return;
    setBusy(true);
    try {
      await importData(pendingImport as never);
      show("Data imported successfully.");
      setDialog(null);
    } catch {
      show("Import failed. Try again.", "error");
    } finally {
      setBusy(false);
    }
  }

  async function confirmClear() {
    setBusy(true);
    try {
      await clearAllData();
      show("All financial data cleared.");
      setDialog(null);
    } catch {
      show("Couldn't clear data. Try again.", "error");
    } finally {
      setBusy(false);
    }
  }

  async function handleLogOut() {
    await signOut();
    router.replace("/register");
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-muted">Manage your account, preferences, and data</p>
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Account</CardTitle>
            <CardDescription>Your Finlight sign-in details.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div>
            <p className="text-sm font-medium text-foreground">Email</p>
            <p className="text-sm text-muted">{user?.email ?? "—"}</p>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
            <div>
              <p className="text-sm font-medium text-foreground">Password</p>
              <p className="text-sm text-muted">••••••••</p>
            </div>
            <Button variant="secondary" onClick={() => setDialog("password")}>
              <KeyRound className="h-4 w-4" /> Change password
            </Button>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
            <div>
              <p className="text-sm font-medium text-foreground">Session</p>
              <p className="text-sm text-muted">Log out of Finlight on this device.</p>
            </div>
            <Button variant="secondary" onClick={handleLogOut}>
              <LogOut className="h-4 w-4" /> Log out
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>Choose how Finlight looks on this device.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <SegmentedControl<ThemePreference>
            ariaLabel="Theme"
            value={settings.theme}
            onChange={(theme) => updateSettings({ theme })}
            options={[
              { value: "light", label: "Light", icon: <Sun className="h-3.5 w-3.5" /> },
              { value: "dark", label: "Dark", icon: <Moon className="h-3.5 w-3.5" /> },
              { value: "system", label: "System", icon: <Laptop className="h-3.5 w-3.5" /> },
            ]}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Currency</CardTitle>
            <CardDescription>All amounts across the app use this currency.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {SUPPORTED_CURRENCIES.map((code: CurrencyCode) => (
              <button
                key={code}
                type="button"
                onClick={() => updateSettings({ currency: code })}
                aria-pressed={settings.currency === code}
                className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                  settings.currency === code
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-border text-muted hover:bg-surface-hover"
                }`}
              >
                <span className="font-semibold">{CURRENCY_META[code].symbol}</span>
                {CURRENCY_META[code].label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Data management</CardTitle>
            <CardDescription>Your financial data is private to your account.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-foreground">Export data</p>
              <p className="text-sm text-muted">Download all your data as a JSON file.</p>
            </div>
            <Button variant="secondary" onClick={handleExport}>
              <Download className="h-4 w-4" /> Export
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
            <div>
              <p className="text-sm font-medium text-foreground">Import data</p>
              <p className="text-sm text-muted">Replace current data with a previously exported file.</p>
            </div>
            <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-4 w-4" /> Import
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={handleFileSelected}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
            <div>
              <p className="text-sm font-medium text-foreground">Clear all financial data</p>
              <p className="text-sm text-muted">
                Permanently delete every transaction, budget, and recurring expense in your
                account. This can&apos;t be undone.
              </p>
            </div>
            <Button variant="danger" onClick={() => setDialog("clear")}>
              <Trash2 className="h-4 w-4" /> Clear data
            </Button>
          </div>
        </CardContent>
      </Card>

      <ChangePasswordModal open={dialog === "password"} onClose={() => setDialog(null)} />

      <ConfirmDialog
        open={dialog === "clear"}
        onClose={() => setDialog(null)}
        onConfirm={confirmClear}
        loading={busy}
        title="Clear all financial data?"
        description="This permanently deletes every transaction, budget, and recurring expense in your account. This can't be undone."
        confirmLabel="Clear everything"
      />
      <ConfirmDialog
        open={dialog === "import"}
        onClose={() => {
          setDialog(null);
          setPendingImport(null);
          setImportError(null);
        }}
        onConfirm={
          importError
            ? () => {
                setDialog(null);
                setImportError(null);
              }
            : confirmImport
        }
        loading={busy}
        destructive={!importError}
        title={importError ? "Couldn't import file" : "Import data?"}
        description={
          importError
            ? importError
            : "This replaces all current data in your account with the contents of the selected file. This can't be undone."
        }
        confirmLabel={importError ? "OK" : "Import & replace"}
      />
    </div>
  );
}
