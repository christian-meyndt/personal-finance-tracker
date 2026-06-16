import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SignOutButton } from "@/components/sign-out-button";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8000";

async function getCurrentUser() {
  const cookieHeader = cookies()
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");
  const res = await fetch(`${BACKEND_URL}/api/v1/auth/me`, {
    headers: { cookie: cookieHeader },
    cache: "no-store",
  });
  if (!res.ok) return null;
  return res.json() as Promise<{ id: number; username: string }>;
}

export default async function Home() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <main className="min-h-screen p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Personal Finance Tracker</h1>
          <SignOutButton />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Link href="/dashboard">
            <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  📈 Dashboard
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Overview of income, expenses, and spending by category
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/analytics">
            <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  📊 Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Interactive charts and spending insights
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/transactions">
            <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  💳 Transactions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  View all imported transactions, filter by date and category
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/categories">
            <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🏷️ Categories
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  View and manage transaction categories and rules
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/budgets">
            <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🎯 Budgets
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Set spending limits and track budget progress
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/import">
            <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  📥 Import
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Upload CSV or sync from PayPal
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Welcome, {user.username}!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="text-muted-foreground">
              Phase 8 complete! Interactive charts and analytics.
            </p>
            <div className="pt-2 space-y-1">
              <p className="font-medium">✅ Available Features:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Dashboard with financial summary</li>
                <li>Interactive charts (line, pie, bar)</li>
                <li>Budget tracking with visual progress</li>
                <li>CSV import (DKB, Hanseatic, Openbank) + PayPal</li>
                <li>Auto-categorization with rules + AI</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
