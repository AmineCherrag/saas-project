"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "./Register.module.css";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { TrendingUp, Lock, Mail, User, Globe, ArrowRight, AlertCircle, ShieldCheck } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [baseCurrency, setBaseCurrency] = useState("USD");
  const [timezone, setTimezone] = useState("America/New_York");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const currencies = [
    { value: "USD", label: "USD ($) - US Dollar" },
    { value: "EUR", label: "EUR (€) - Euro" },
    { value: "GBP", label: "GBP (£) - British Pound" },
    { value: "CAD", label: "CAD ($) - Canadian Dollar" },
    { value: "AUD", label: "AUD ($) - Australian Dollar" },
    { value: "JPY", label: "JPY (¥) - Japanese Yen" },
  ];

  const timezones = [
    { value: "America/New_York", label: "Eastern Time (US / New York)" },
    { value: "America/Chicago", label: "Central Time (US / Chicago)" },
    { value: "America/Denver", label: "Mountain Time (US / Denver)" },
    { value: "America/Los_Angeles", label: "Pacific Time (US / Los Angeles)" },
    { value: "Europe/London", label: "London / GMT" },
    { value: "Europe/Berlin", label: "Central European (Frankfurt / Berlin)" },
    { value: "Asia/Tokyo", label: "Tokyo (JST)" },
    { value: "Asia/Singapore", label: "Singapore / Hong Kong" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          baseCurrency,
          timezone,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || "Registration failed. Please check inputs.");
      }

      // Successful registration -> Navigate to dashboard
      router.push("/dashboard");
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Registration error occurred");
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
          <h1 className={styles.title}>Create your TradePulse Account</h1>
          <p className={styles.subtitle}>
            Start your 7-day Pro trial. No credit card required to start.
          </p>
        </div>

        {errorMessage && (
          <div className={styles.errorAlert}>
            <AlertCircle size={16} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className={styles.form}>
          <Input
            label="Full Name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Alex Trader"
            leftAddon={<User size={16} />}
            required
          />

          <Input
            label="Work or Personal Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="alex.trader@example.com"
            leftAddon={<Mail size={16} />}
            required
          />

          <Input
            label="Password (min 8 chars, 1 uppercase, 1 number)"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••"
            leftAddon={<Lock size={16} />}
            required
          />

          <div className={styles.gridRow}>
            <Select
              label="Base Currency"
              value={baseCurrency}
              onChange={(e) => setBaseCurrency(e.target.value)}
              options={currencies}
            />

            <Select
              label="Trading Timezone"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              options={timezones}
            />
          </div>

          <div className={styles.securityNotice}>
            <ShieldCheck size={16} className={styles.shieldIcon} />
            <span>Bank-grade multi-tenant data isolation & encryption.</span>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isLoading}
            rightIcon={<ArrowRight size={16} />}
            className={styles.submitBtn}
          >
            Create Account & Begin Trial
          </Button>
        </form>

        <div className={styles.footer}>
          <span>Already have an account?</span>{" "}
          <Link href="/login" className={styles.loginLink}>
            Sign in here
          </Link>
        </div>
      </div>
    </div>
  );
}
