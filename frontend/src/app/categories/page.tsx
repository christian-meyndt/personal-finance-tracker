"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NavHeader } from "@/components/nav-header";

export default function CategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);
  const [uncategorized, setUncategorized] = useState<any[]>([]);
  const [categorizing, setCategorizing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // New category form
  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState("");
  const [creating, setCreating] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Nice color palette for categories
  const categoryColors = [
    "#EF4444", "#F59E0B", "#10B981", "#3B82F6", "#8B5CF6",
    "#EC4899", "#06B6D4", "#84CC16", "#F97316", "#6366F1",
    "#14B8A6", "#A855F7", "#EAB308", "#22C55E", "#0EA5E9",
    "#D946EF", "#F43F5E", "#78716C", "#64748B"
  ];

  // Generate unique color based on existing categories
  const getUniqueColor = () => {
    const usedColors = new Set(categories.map((c: any) => c.color).filter(Boolean));
    const availableColors = categoryColors.filter(c => !usedColors.has(c));
    if (availableColors.length > 0) {
      return availableColors[0];
    }
    // If all colors used, pick a random one
    return categoryColors[Math.floor(Math.random() * categoryColors.length)];
  };

  // Common emojis for finance categories
  const commonEmojis = [
    "🛒", "🍽️", "🚗", "🎬", "🛍️", "⚕️", "⚡", "🏠", "💰", "📱",
    "🎯", "📚", "⚽", "🎮", "✈️", "🏥", "🔧", "👕", "💄", "🐕",
    "🌳", "🎵", "📺", "💻", "☕", "🍺", "🎂", "💳", "🔑", "📦",
    "🚌", "🚕", "⛽", "🏋️", "🧘", "💇", "🎨", "📷", "🎪", "🏖️",
    "🍕", "🍔", "🥗", "🍜", "☎️", "📧", "🎓", "🏦", "🏪", "🛠️",
    "🏃", "🚴", "🏊", "🎾", "🏀", "⚾", "🏈", "⛷️", "🏂", "🎿"
  ];

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      // Load categories
      const catRes = await fetch("/api/backend/api/v1/categories", {
        credentials: "include",
      });
      if (catRes.ok) {
        const catData = await catRes.json();
        setCategories(catData);
      }

      // Load uncategorized transactions
      const uncatRes = await fetch("/api/backend/api/v1/transactions/uncategorized", {
        credentials: "include",
      });
      if (uncatRes.ok) {
        const uncatData = await uncatRes.json();
        setUncategorized(uncatData);
      }
    } catch (err) {
      console.error("Failed to load data:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAutoCategorize() {
    setCategorizing(true);
    setResult(null);

    try {
      const res = await fetch("/api/backend/api/v1/transactions/categorize-all", {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Categorization failed");
      }

      const data = await res.json();
      setResult(data);

      // Reload data after 1 second
      setTimeout(() => {
        loadData();
        setResult(null);
      }, 2000);
    } catch (err: any) {
      console.error("Categorization error:", err);
      setResult({ error: err.message });
    } finally {
      setCategorizing(false);
    }
  }

  async function handleCreateCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!newName) return;

    setCreating(true);

    try {
      const res = await fetch("/api/backend/api/v1/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: newName,
          icon: newIcon || null,
          color: getUniqueColor(),
        }),
      });

      if (res.ok) {
        // Reset form
        setNewName("");
        setNewIcon("");

        // Reload categories
        await loadData();
        alert("Kategorie erfolgreich erstellt!");
      } else {
        alert("Fehler beim Erstellen der Kategorie");
      }
    } catch (error) {
      console.error("Error creating category:", error);
      alert("Fehler beim Erstellen der Kategorie");
    } finally {
      setCreating(false);
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
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Kategorien</h1>
            {uncategorized.length > 0 && (
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-yellow-100 dark:bg-yellow-900 px-3 py-1 text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  {uncategorized.length} nicht kategorisiert
                </span>
                <Button onClick={handleAutoCategorize} disabled={categorizing}>
                  {categorizing ? "Kategorisiere..." : "Alle automatisch kategorisieren"}
                </Button>
              </div>
            )}
          </div>

          {result && !result.error && (
            <div className="rounded-md bg-green-50 dark:bg-green-950 p-4">
              <p className="font-medium text-green-900 dark:text-green-100">
                Kategorisierung abgeschlossen! 🎉
              </p>
              <p className="text-sm text-green-800 dark:text-green-200">
                Verarbeitet: {result.processed}, Kategorisiert: {result.categorized}
              </p>
            </div>
          )}

          {result?.error && (
            <div className="rounded-md bg-red-50 dark:bg-red-950 p-4">
              <p className="text-sm text-red-800 dark:text-red-200">
                {result.error}
              </p>
            </div>
          )}

          {uncategorized.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Nicht kategorisierte Transaktionen</CardTitle>
                <CardDescription>
                  Diese Transaktionen wurden noch keiner Kategorie zugeordnet.
                  Klicken Sie auf "Alle automatisch kategorisieren" um Regeln und KI zu verwenden, oder weisen Sie Kategorien manuell auf der Transaktionsseite zu.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {uncategorized.slice(0, 10).map((txn: any) => {
                    const amount = txn.amount_cents / 100;
                    const isExpense = amount < 0;
                    return (
                      <div
                        key={txn.id}
                        className="flex items-center justify-between border-b pb-2 last:border-b-0"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {txn.counterparty || txn.description || "Unknown"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {txn.date} • {txn.source || "manual"}
                          </p>
                        </div>
                        <div
                          className={`text-sm font-mono ${
                            isExpense ? "text-red-600" : "text-green-600"
                          }`}
                        >
                          {amount.toFixed(2)} €
                        </div>
                      </div>
                    );
                  })}
                  {uncategorized.length > 10 && (
                    <p className="text-xs text-muted-foreground text-center pt-2">
                      ... and {uncategorized.length - 10} more
                    </p>
                  )}
                </div>
                <div className="mt-4">
                  <Link href="/transactions">
                    <Button variant="outline" size="sm" className="w-full">
                      Alle Transaktionen anzeigen
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          {uncategorized.length === 0 && (
            <Card>
              <CardContent className="py-8">
                <div className="text-center">
                  <p className="text-lg font-medium text-green-600 dark:text-green-400">
                    ✓ Alle Transaktionen sind kategorisiert!
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Gut gemacht! Alle Ihre Transaktionen wurden Kategorien zugeordnet.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Create New Category Form */}
          <Card>
            <CardHeader>
              <CardTitle>Neue Kategorie erstellen</CardTitle>
              <CardDescription>
                Erstellen Sie eine eigene Kategorie für Ihre Transaktionen
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateCategory} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      placeholder="z.B. Sport, Bildung, Haustiere"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="icon">Icon (Emoji)</Label>
                    <div className="flex gap-2">
                      <Input
                        id="icon"
                        placeholder="z.B. ⚽ 📚 🐕"
                        value={newIcon}
                        onChange={(e) => setNewIcon(e.target.value)}
                        maxLength={2}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      >
                        {showEmojiPicker ? "Schließen" : "Emoji..."}
                      </Button>
                    </div>
                    {showEmojiPicker && (
                      <div className="border-2 rounded-lg p-4 bg-white dark:bg-gray-900">
                        <div className="mb-3 text-sm font-semibold">Emoji wählen ({commonEmojis.length} verfügbar):</div>
                        <div
                          className="border rounded p-2 bg-gray-50 dark:bg-gray-950"
                          style={{
                            height: '240px',
                            overflowY: 'scroll',
                            overflowX: 'hidden'
                          }}
                        >
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(10, 1fr)',
                            gap: '8px'
                          }}>
                            {commonEmojis.map((emoji, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => {
                                  setNewIcon(emoji);
                                  setShowEmojiPicker(false);
                                }}
                                style={{
                                  fontSize: '24px',
                                  padding: '8px',
                                  border: '1px solid #e5e7eb',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  background: 'white',
                                  width: '40px',
                                  height: '40px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Optional: Klicken Sie auf "Emoji..." für Auswahl
                    </p>
                  </div>

                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={creating || !newName}>
                    {creating ? "Erstellt..." : "Kategorie erstellen"}
                  </Button>
                  {newName && (
                    <div className="flex items-center gap-2 px-4 py-2 rounded-md border">
                      <span className="text-lg">{newIcon || "📦"}</span>
                      <span className="font-medium">{newName}</span>
                      <div
                        className="w-4 h-4 rounded-full border ml-2"
                        style={{ backgroundColor: getUniqueColor() }}
                      />
                    </div>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Alle Kategorien ({categories.length})</CardTitle>
              <CardDescription>
                Kategorien werden verwendet, um Ihre Transaktionen zu organisieren und Ausgaben nach Typ zu verfolgen.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {categories.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  Noch keine Kategorien.
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {categories.map((category: any) => (
                    <div
                      key={category.id}
                      className="rounded-lg border p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        {category.icon && (
                          <span className="text-2xl">{category.icon}</span>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium">{category.name}</h3>
                          {category.parent_id && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Subcategory
                            </p>
                          )}
                        </div>
                      </div>
                      {category.color && (
                        <div className="mt-3 flex items-center gap-2">
                          <div
                            className="h-4 w-4 rounded-full border"
                            style={{ backgroundColor: category.color }}
                          />
                          <span className="text-xs text-muted-foreground">
                            {category.color}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Wie Kategorisierung funktioniert</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-sm">
                <div>
                  <p className="font-medium mb-2">1. Regelbasierte Zuordnung</p>
                  <p className="text-muted-foreground">
                    Transaktionen werden automatisch durch Musterabgleichsregeln kategorisiert.
                    Zum Beispiel: Amazon → Einkäufe, Netflix → Abonnements, Lidl → Lebensmittel.
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Derzeit aktiv: 17 Regeln für gängige Händler
                  </p>
                </div>

                <div>
                  <p className="font-medium mb-2">2. KI-Fallback (Optional)</p>
                  <p className="text-muted-foreground">
                    Wenn keine Regel zutrifft und Sie den Anthropic API-Schlüssel konfiguriert haben,
                    kategorisiert Claude Haiku die Transaktion intelligent basierend auf
                    dem Händlernamen und der Beschreibung.
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    KI-Kategorisierung erfordert ANTHROPIC_API_KEY in backend/.env
                  </p>
                </div>

                <div>
                  <p className="font-medium mb-2">3. Manuelle Zuweisung</p>
                  <p className="text-muted-foreground">
                    Sie können Transaktionen auf der Transaktionsseite manuell Kategorien zuweisen.
                    Zukünftige Transaktionen vom gleichen Händler können diese Kategorie automatisch verwenden,
                    indem Sie eine Regel erstellen.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
