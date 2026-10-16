import React from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AuthService } from "@/lib/auth/auth-service";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("tradepulse_session");
  const token = sessionCookie?.value?.trim();

  if (!token) {
    redirect("/login?redirect=/admin");
  }

  const session = AuthService.getSession(token);
  if (!session) {
    redirect("/login?redirect=/admin");
  }

  if (session.role !== "ADMIN") {
    // Non-admins get redirected away from admin area
    redirect("/dashboard?error=forbidden");
  }

  return <>{children}</>;
}
