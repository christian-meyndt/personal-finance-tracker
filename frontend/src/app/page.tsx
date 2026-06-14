import { cookies } from "next/headers";
import { redirect } from "next/navigation";

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

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="hover:bg-accent/50 transition-colors cursor-pointer" onClick={() => window.location.href = '/transactions'}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                📊 Transactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                View all imported transactions, filter by date and category
              </p>
            </CardContent>
          </Card>

          <Card className="hover:bg-accent/50 transition-colors cursor-pointer" onClick={() => window.location.href = '/import'}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                📥 Import CSV
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Upload transactions from DKB, Hanseatic Bank, or Openbank
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Welcome, {user.username}!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="text-muted-foreground">
              Phase 3 complete! You can now import CSV files and view transactions.
            </p>
            <div className="pt-2 space-y-1">
              <p className="font-medium">✅ Available Features:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>CSV import (DKB format)</li>
                <li>Transaction list with details</li>
                <li>Automatic deduplication</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
