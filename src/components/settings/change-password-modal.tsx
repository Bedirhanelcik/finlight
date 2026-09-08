"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { TextInput } from "@/components/ui/form-field";
import { useAuth } from "@/context/auth-provider";
import { useToast } from "@/context/toast-provider";

export function ChangePasswordModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { updatePassword } = useAuth();
  const { show } = useToast();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  function handleClose() {
    setPassword("");
    setConfirmPassword("");
    setErrors({});
    setFormError(null);
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!password) nextErrors.password = "New password is required.";
    else if (password.length < 6) nextErrors.password = "Use at least 6 characters.";
    if (confirmPassword !== password) nextErrors.confirmPassword = "Passwords don't match.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    setFormError(null);
    const result = await updatePassword(password);
    setSubmitting(false);
    if (result.error) {
      setFormError(result.error);
      return;
    }
    show("Password updated.");
    handleClose();
  }

  return (
    <Modal open={open} onClose={handleClose} title="Change password" size="sm">
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <TextInput
          label="New password"
          type="password"
          autoComplete="new-password"
          required
          value={password}
          error={errors.password}
          hint={!errors.password ? "At least 6 characters." : undefined}
          onChange={(e) => setPassword(e.target.value)}
        />
        <TextInput
          label="Confirm new password"
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
        <div className="mt-1 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={handleClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" loading={submitting}>
            Update password
          </Button>
        </div>
      </form>
    </Modal>
  );
}
