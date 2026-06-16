"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ImportPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // PayPal sync state
  const [paypalSyncing, setPaypalSyncing] = useState(false);
  const [paypalResult, setPaypalResult] = useState<any>(null);
  const [paypalError, setPaypalError] = useState<string | null>(null);
  const [paypalDays, setPaypalDays] = useState(30);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("account_id", "1"); // Default to account 1 for now

      const res = await fetch("/api/backend/api/v1/import/csv", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || "Import failed");
      }

      const data = await res.json();
      setResult(data);

      // Redirect to transactions after 2 seconds
      setTimeout(() => {
        router.push("/transactions");
      }, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function handlePayPalSync(e: React.FormEvent) {
    e.preventDefault();
    setPaypalSyncing(true);
    setPaypalError(null);
    setPaypalResult(null);

    try {
      const res = await fetch(`/api/backend/api/v1/import/paypal?account_id=1&days=${paypalDays}`, {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || "PayPal sync failed");
      }

      const data = await res.json();
      setPaypalResult(data);

      // Redirect to transactions after 2 seconds
      setTimeout(() => {
        router.push("/transactions");
      }, 2000);
    } catch (err: any) {
      setPaypalError(err.message);
    } finally {
      setPaypalSyncing(false);
    }
  }

  return (
    <main className="min-h-screen p-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-muted-foreground hover:text-foreground">
            ← Zurück
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">Transaktionen importieren</h1>
            <p className="text-muted-foreground mt-2">
              Laden Sie eine CSV-Datei von Ihrer Bank hoch (DKB, Hanseatic Bank oder Openbank)
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>CSV-Upload</CardTitle>
            <CardDescription>
              Unterstützte Formate: DKB, Hanseatic Bank, Openbank
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="file">CSV-Datei</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".csv"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Wählen Sie einen CSV-Export von Ihrer Bank aus
                </p>
              </div>

              {error && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              {result && (
                <div className="rounded-md bg-green-50 dark:bg-green-950 p-4 space-y-2">
                  <p className="font-medium text-green-900 dark:text-green-100">
                    Import erfolgreich! 🎉
                  </p>
                  <div className="text-sm text-green-800 dark:text-green-200">
                    <p>Bankformat erkannt: <strong>{result.bank}</strong></p>
                    <p>Importiert: <strong>{result.imported}</strong> neue Transaktionen</p>
                    <p>Übersprungen: <strong>{result.skipped}</strong> Duplikate</p>
                    <p>Gesamt: <strong>{result.total}</strong> Transaktionen verarbeitet</p>
                  </div>
                  <p className="text-xs text-green-700 dark:text-green-300 mt-2">
                    Weiterleitung zur Transaktionsliste...
                  </p>
                </div>
              )}

              <Button type="submit" disabled={!file || uploading} className="w-full">
                {uploading ? "Hochladen..." : "Hochladen & Importieren"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>PayPal-Synchronisierung</CardTitle>
            <CardDescription>
              Transaktionen direkt von Ihrem PayPal-Konto synchronisieren
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePayPalSync} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="days">Tage zum Synchronisieren</Label>
                <Input
                  id="days"
                  type="number"
                  min="1"
                  max="365"
                  value={paypalDays}
                  onChange={(e) => setPaypalDays(parseInt(e.target.value))}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Anzahl der abzurufenden Tage (1-365)
                </p>
              </div>

              {paypalError && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {paypalError}
                </div>
              )}

              {paypalResult && (
                <div className="rounded-md bg-green-50 dark:bg-green-950 p-4 space-y-2">
                  <p className="font-medium text-green-900 dark:text-green-100">
                    PayPal-Synchronisierung erfolgreich! 🎉
                  </p>
                  <div className="text-sm text-green-800 dark:text-green-200">
                    <p>Importiert: <strong>{paypalResult.imported}</strong> neue Transaktionen</p>
                    <p>Übersprungen: <strong>{paypalResult.skipped}</strong> Duplikate</p>
                    <p>Gesamt: <strong>{paypalResult.total}</strong> Transaktionen verarbeitet</p>
                  </div>
                  <p className="text-xs text-green-700 dark:text-green-300 mt-2">
                    Weiterleitung zur Transaktionsliste...
                  </p>
                </div>
              )}

              <Button type="submit" disabled={paypalSyncing} className="w-full">
                {paypalSyncing ? "Synchronisiere..." : "PayPal-Transaktionen synchronisieren"}
              </Button>

              <p className="text-xs text-muted-foreground">
                Hinweis: PayPal-API-Anmeldeinformationen müssen in backend/.env konfiguriert sein
              </p>
            </form>
          </CardContent>
        </Card>

        <div className="text-sm text-muted-foreground space-y-2">
          <p className="font-medium">Unterstützte Banken:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>DKB (Deutsche Kreditbank) - Deutsches Format mit Semikolon-Trennzeichen</li>
            <li>Hanseatic Bank - Kreditkartenabrechnungen</li>
            <li>Openbank - Spanische Bank mit flexiblem Format</li>
            <li>PayPal - Direkte API-Synchronisierung (erfordert Anmeldeinformationen)</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
