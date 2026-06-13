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
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Personal Finance Tracker</h1>
          <SignOutButton />
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Signed in</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p>
              <span className="text-muted-foreground">Username: </span>
              {user.username}
            </p>
            <p>
              <span className="text-muted-foreground">User ID: </span>
              {user.id}
            </p>
            <p className="pt-4 text-muted-foreground">
              Phase 1 complete! Backend with 15 API endpoints ready. Next: Phase 2 (CSV import & PayPal).
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
