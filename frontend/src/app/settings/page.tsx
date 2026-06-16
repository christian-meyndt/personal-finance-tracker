"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { NavHeader } from "@/components/nav-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SettingsPage() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Export filters
  const [exportStartDate, setExportStartDate] = useState("");
  const [exportEndDate, setExportEndDate] = useState("");
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      // Load accounts
      const accRes = await fetch("/api/backend/api/v1/accounts", {
        credentials: "include",
      });
      if (accRes.ok) {
        const data = await accRes.json();
        setAccounts(data);
      }

      // Load categories
      const catRes = await fetch("/api/backend/api/v1/categories", {
        credentials: "include",
      });
      if (catRes.ok) {
        const data = await catRes.json();
        setCategories(data);
      }

      // Load rules
      const rulesRes = await fetch("/api/backend/api/v1/rules", {
        credentials: "include",
      });
      if (rulesRes.ok) {
        const data = await rulesRes.json();
        setRules(data);
      }
    } catch (err) {
      console.error("Failed to load data:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleExportCSV() {
    setExporting(true);
    try {
      let url = "/api/backend/api/v1/export/transactions/csv";
      const params = new URLSearchParams();

      if (exportStartDate) params.append("start_date", exportStartDate);
      if (exportEndDate) params.append("end_date", exportEndDate);

      if (params.toString()) {
        url += "?" + params.toString();
      }

      const res = await fetch(url, {
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Export failed");
      }

      // Download file
      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `transaktionen_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error("Export error:", err);
      alert("Export fehlgeschlagen");
    } finally {
      setExporting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <NavHeader />
        <main className="p-8">
          <div className="mx-auto max-w-7xl">
            <p className="text-muted-foreground">Lädt...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <NavHeader />
      <main className="p-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Einstellungen</h1>
            <p className="text-muted-foreground mt-2">
              Konten, Kategorien und Datenexport verwalten
            </p>
          </div>

          {/* Export Section */}
          <Card>
            <CardHeader>
              <CardTitle>Daten exportieren</CardTitle>
              <CardDescription>
                Transaktionen als CSV-Datei exportieren
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="start-date">Startdatum (optional)</Label>
                    <Input
                      id="start-date"
                      type="date"
                      value={exportStartDate}
                      onChange={(e) => setExportStartDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end-date">Enddatum (optional)</Label>
                    <Input
                      id="end-date"
                      type="date"
                      value={exportEndDate}
                      onChange={(e) => setExportEndDate(e.target.value)}
                    />
                  </div>
                </div>

                <Button onClick={handleExportCSV} disabled={exporting}>
                  {exporting ? "Exportiere..." : "CSV exportieren"}
                </Button>

                <p className="text-sm text-muted-foreground">
                  Exportiert alle Transaktionen im angegebenen Zeitraum.
                  Ohne Datumsangabe werden alle Transaktionen exportiert.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Accounts */}
          <Card>
            <CardHeader>
              <CardTitle>Konten ({accounts.length})</CardTitle>
              <CardDescription>
                Ihre verbundenen Bankkonten
              </CardDescription>
            </CardHeader>
            <CardContent>
              {accounts.length === 0 ? (
                <p className="text-sm text-muted-foreground">Keine Konten konfiguriert</p>
              ) : (
                <div className="space-y-3">
                  {accounts.map((account) => (
                    <div
                      key={account.id}
                      className="flex items-center justify-between border-b pb-3 last:border-b-0"
                    >
                      <div>
                        <p className="font-medium">{account.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {account.account_type} • Konto #{account.id}
                        </p>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {account.currency || "EUR"}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Categories */}
          <Card>
            <CardHeader>
              <CardTitle>Kategorien ({categories.length})</CardTitle>
              <CardDescription>
                Transaktionskategorien zur Organisation Ihrer Ausgaben
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center gap-3 rounded-lg border p-3"
                  >
                    {category.icon && <span className="text-xl">{category.icon}</span>}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{category.name}</p>
                      {category.color && (
                        <div className="flex items-center gap-2 mt-1">
                          <div
                            className="h-3 w-3 rounded-full border"
                            style={{ backgroundColor: category.color }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Categorization Rules */}
          <Card>
            <CardHeader>
              <CardTitle>Kategorisierungsregeln ({rules.length})</CardTitle>
              <CardDescription>
                Automatische Regeln zur Kategorisierung von Transaktionen
              </CardDescription>
            </CardHeader>
            <CardContent>
              {rules.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Keine Regeln konfiguriert
                </p>
              ) : (
                <div className="space-y-2">
                  {rules.slice(0, 10).map((rule) => {
                    const category = categories.find((c) => c.id === rule.category_id);
                    return (
                      <div
                        key={rule.id}
                        className="flex items-center justify-between border-b pb-2 last:border-b-0"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {category?.icon && (
                            <span className="text-lg">{category.icon}</span>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">
                              {rule.pattern}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {rule.match_type} → {category?.name || "Unbekannt"}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {rules.length > 10 && (
                    <p className="text-xs text-muted-foreground text-center pt-2">
                      ... und {rules.length - 10} weitere Regeln
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* System Info */}
          <Card>
            <CardHeader>
              <CardTitle>Systeminformationen</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Version</span>
                  <span className="font-medium">1.0.0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Backend</span>
                  <span className="font-medium">FastAPI + SQLAlchemy</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Frontend</span>
                  <span className="font-medium">Next.js 16 + React 19</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Datenbank</span>
                  <span className="font-medium">SQLite</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
