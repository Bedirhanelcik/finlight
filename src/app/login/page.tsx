"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { TextInput } from "@/components/ui/form-field";
import { useAuth } from "@/context/auth-provider";

export default function LoginPage() {
  const router = useRouter();
  const { status, signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "authenticated") router.replace("/");
  }, [status, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!email.trim()) nextErrors.email = "Email is required.";
    if (!password) nextErrors.password = "Password is required.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    setFormError(null);
    const result = await signIn(email.trim(), password);
    if (result.error) {
      setFormError(result.error);
      setSubmitting(false);
      return;
    }
    router.replace("/");
  }

  if (status === "authenticated") return null;

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to your Finlight account."
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-medium text-accent hover:underline">
            Create account
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <TextInput
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={email}
          error={errors.email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <TextInput
          label="Password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          error={errors.password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {formError && (
          <p role="alert" className="text-sm font-medium text-negative">
            {formError}
          </p>
        )}
        <Button type="submit" size="lg" loading={submitting} className="mt-1 w-full justify-center">
          Log in
        </Button>
      </form>
    </AuthShell>
  );
}
