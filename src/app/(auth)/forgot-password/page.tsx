"use client";

import React, { useState } from "react";
import Link from "next/link";
import styles from "../login/Auth.module.css";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { TrendingUp, Mail, ArrowLeft, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const res = await fetch("/api/v1/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || "Failed to submit request");
      }

      setSuccessMessage(
        "If an account is associated with that email, a password recovery link has been dispatched."
      );
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.authContainer}>
      <div className={styles.authCard}>
        <div className={styles.brandHeader}>
          <div className={styles.logoIcon}>
            <TrendingUp size={24} />
          </div>
          <h1 className={styles.title}>Password Recovery</h1>
          <p className={styles.subtitle}>
            Enter your account email to receive a secure password reset token
          </p>
        </div>

        {errorMessage && (
          <div className={styles.errorAlert}>
            <AlertCircle size={16} />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage ? (
          <div style={{ textAlign: "center", padding: "16px 0" }}>
            <CheckCircle2 size={40} color="var(--color-profit)" style={{ margin: "0 auto 12px" }} />
            <p style={{ color: "var(--text-primary)", fontSize: "14px", lineHeight: "1.5" }}>
              {successMessage}
            </p>
            <div style={{ marginTop: "24px" }}>
              <Link href="/login">
                <Button variant="secondary" size="md" leftIcon={<ArrowLeft size={16} />}>
                  Back to Sign In
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={styles.form}>
            <Input
              label="Account Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="trader@example.com"
              leftAddon={<Mail size={16} />}
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              rightIcon={<ArrowRight size={16} />}
              className={styles.submitBtn}
            >
              Send Recovery Link
            </Button>

            <div style={{ textAlign: "center", marginTop: "12px" }}>
              <Link href="/login" style={{ color: "var(--text-muted)", fontSize: "13px" }}>
                ← Return to Sign In
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
