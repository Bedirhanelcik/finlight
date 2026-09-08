import { AuthGuard } from "@/components/auth/auth-guard";
import { OnboardingGuard } from "@/components/auth/onboarding-guard";
import { DataProvider } from "@/context/data-provider";
import { AppShell } from "@/components/layout/app-shell";

export default function AppGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <DataProvider>
        <OnboardingGuard>
          <AppShell>{children}</AppShell>
        </OnboardingGuard>
      </DataProvider>
    </AuthGuard>
  );
}
