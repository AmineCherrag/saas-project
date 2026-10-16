"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "./Auth.module.css";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { TrendingUp, Lock, Mail, ArrowRight, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || "Invalid login credentials");
      }

      // Successful login -> Navigate to dashboard
      router.push("/dashboard");
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Authentication error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.authContainer}>
      <div className={styles.authCard}>
        {/* Brand Header */}
        <div className={styles.brandHeader}>
          <div className={styles.logoIcon}>
            <TrendingUp size={24} />
          </div>
          <h1 className={styles.title}>Welcome back to TradePulse</h1>
          <p className={styles.subtitle}>
            Sign in to access your trading journal and performance analytics
          </p>
        </div>

        {errorMessage && (
          <div className={styles.errorAlert}>
            <AlertCircle size={16} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className={styles.form}>
          <Input
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="trader@example.com"
            leftAddon={<Mail size={16} />}
            required
          />

          <div className={styles.passwordField}>
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              leftAddon={<Lock size={16} />}
              required
            />
            <div className={styles.forgotRow}>
              <Link href="/forgot-password" className={styles.forgotLink}>
                Forgot password?
              </Link>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isLoading}
            rightIcon={<ArrowRight size={16} />}
            className={styles.submitBtn}
          >
            Sign In to Dashboard
          </Button>
        </form>

        <div className={styles.footer}>
          <span>Don&apos;t have an account yet?</span>{" "}
          <Link href="/register" className={styles.registerLink}>
            Start 14-day free trial
          </Link>
        </div>
      </div>
    </div>
  );
}
