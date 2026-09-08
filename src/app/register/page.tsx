"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { TextInput } from "@/components/ui/form-field";
import { useAuth } from "@/context/auth-provider";

export default function RegisterPage() {
  const router = useRouter();
  const { status, signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      nextErrors.email = "Enter a valid email address.";
    }
    if (!password) nextErrors.password = "Password is required.";
    else if (password.length < 6) nextErrors.password = "Use at least 6 characters.";
    if (confirmPassword !== password) {
      nextErrors.confirmPassword = "Passwords don't match.";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    setFormError(null);
    const result = await signUp(email.trim(), password);
    if (result.error) {
      setFormError(result.error);
      setSubmitting(false);
      return;
    }
    router.replace("/welcome");
  }

  if (status === "authenticated") return null;

  return (
    <AuthShell
      title="Create your account"
      subtitle="Manage your money with clarity."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-accent hover:underline">
            Log in
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
          autoComplete="new-password"
          required
          value={password}
          error={errors.password}
          hint={!errors.password ? "At least 6 characters." : undefined}
          onChange={(e) => setPassword(e.target.value)}
        />
        <TextInput
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          required
          value={confirmPassword}
          error={errors.confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        {formError && (
          <p role="alert" className="text-sm font-medium text-negative">
            {formError}
          </p>
        )}
        <Button type="submit" size="lg" loading={submitting} className="mt-1 w-full justify-center">
          Create account
        </Button>
      </form>
    </AuthShell>
  );
}
