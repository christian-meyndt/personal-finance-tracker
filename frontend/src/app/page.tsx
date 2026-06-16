import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SignOutButton } from "@/components/sign-out-button";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8000";

async function getCurrentUser() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
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
          <h1 className="text-2xl font-semibold">Persönlicher Finanztracker</h1>
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
                  Übersicht über Einnahmen, Ausgaben und Ausgaben nach Kategorie
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/analytics">
            <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  📊 Analysen
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Interaktive Diagramme und Ausgabeneinblicke
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/transactions">
            <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  💳 Transaktionen
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Alle importierten Transaktionen anzeigen, nach Datum und Kategorie filtern
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/categories">
            <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🏷️ Kategorien
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Transaktionskategorien und Regeln anzeigen und verwalten
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
                  Ausgabenlimits festlegen und Budgetfortschritt verfolgen
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
                  CSV hochladen oder von PayPal synchronisieren
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/settings">
            <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  ⚙️ Einstellungen
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Konten, Kategorien und Datenexport verwalten
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Willkommen, {user.username}!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="text-muted-foreground">
              Phase 8 abgeschlossen! Interaktive Diagramme und Analysen.
            </p>
            <div className="pt-2 space-y-1">
              <p className="font-medium">✅ Verfügbare Funktionen:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Dashboard mit Finanzübersicht</li>
                <li>Interaktive Diagramme (Linien, Kreis, Balken)</li>
                <li>Budget-Tracking mit visuellem Fortschritt</li>
                <li>CSV-Import (DKB, Hanseatic, Openbank) + PayPal</li>
                <li>Auto-Kategorisierung mit Regeln + KI</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
