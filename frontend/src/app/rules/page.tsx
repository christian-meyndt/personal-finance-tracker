"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NavHeader } from "@/components/nav-header";

interface Rule {
  id: number;
  pattern: string;
  match_type: string;
  category_id: number;
}

interface Category {
  id: number;
  name: string;
  icon: string | null;
}

export default function RulesPage() {
  const router = useRouter();
  const [rules, setRules] = useState<Rule[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);

  // New rule form
  const [pattern, setPattern] = useState("");
  const [matchType, setMatchType] = useState("contains");
  const [categoryId, setCategoryId] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [rulesRes, categoriesRes] = await Promise.all([
        fetch("/api/backend/api/v1/rules", { credentials: "include" }),
        fetch("/api/backend/api/v1/categories", { credentials: "include" }),
      ]);

      if (rulesRes.ok && categoriesRes.ok) {
        const rulesData = await rulesRes.json();
        const categoriesData = await categoriesRes.json();
        setRules(rulesData);
        setCategories(categoriesData);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddRule(e: React.FormEvent) {
    e.preventDefault();
    if (!pattern || !categoryId) return;

    setAdding(true);

    try {
      const res = await fetch("/api/backend/api/v1/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          pattern,
          match_type: matchType,
          category_id: parseInt(categoryId),
        }),
      });

      if (res.ok) {
        // Reset form
        setPattern("");
        setMatchType("contains");
        setCategoryId("");

        // Refresh rules list
        await fetchData();
      } else {
        alert("Fehler beim Hinzufügen der Regel");
      }
    } catch (error) {
      console.error("Error adding rule:", error);
      alert("Fehler beim Hinzufügen der Regel");
    } finally {
      setAdding(false);
    }
  }

  async function handleDeleteRule(ruleId: number) {
    if (!confirm("Regel wirklich löschen?")) return;

    setDeleting(ruleId);

    try {
      const res = await fetch(`/api/backend/api/v1/rules/${ruleId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (res.ok) {
        await fetchData();
      } else {
        alert("Fehler beim Löschen der Regel");
      }
    } catch (error) {
      console.error("Error deleting rule:", error);
      alert("Fehler beim Löschen der Regel");
    } finally {
      setDeleting(null);
    }
  }

  const getCategoryName = (categoryId: number) => {
    const category = categories.find((c) => c.id === categoryId);
    return category ? `${category.icon || ""} ${category.name}` : "Unbekannt";
  };

  const matchTypeLabels: { [key: string]: string } = {
    contains: "Enthält",
    starts_with: "Beginnt mit",
    exact: "Exakt",
    regex: "Regex",
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <NavHeader />
        <main className="p-8">
          <div className="mx-auto max-w-7xl">
            <p>Laden...</p>
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
          <h1 className="text-3xl font-bold">Kategorisierungsregeln</h1>
          <p className="text-muted-foreground">
            Definieren Sie Regeln, um Transaktionen automatisch zu kategorisieren.
            Aktuell: <strong>{rules.length} Regeln</strong>
          </p>

          {/* Add New Rule Form */}
          <Card>
            <CardHeader>
              <CardTitle>Neue Regel hinzufügen</CardTitle>
              <CardDescription>
                Transaktionen, die dem Muster entsprechen, werden automatisch kategorisiert
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddRule} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="pattern">Muster</Label>
                    <Input
                      id="pattern"
                      placeholder="z.B. REWE, NETFLIX, SHELL"
                      value={pattern}
                      onChange={(e) => setPattern(e.target.value)}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Text zum Suchen in Beschreibung oder Gegenseite
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="match-type">Übereinstimmung</Label>
                    <Select value={matchType} onValueChange={setMatchType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="contains">Enthält</SelectItem>
                        <SelectItem value="starts_with">Beginnt mit</SelectItem>
                        <SelectItem value="exact">Exakt</SelectItem>
                        <SelectItem value="regex">Regex</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Kategorie</Label>
                    <Select value={categoryId} onValueChange={setCategoryId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Kategorie wählen..." />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id.toString()}>
                            <span className="inline-flex items-center gap-2">
                              {cat.icon && <span>{cat.icon}</span>}
                              {cat.name}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button type="submit" disabled={adding || !pattern || !categoryId}>
                  {adding ? "Wird hinzugefügt..." : "Regel hinzufügen"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Existing Rules List */}
          <Card>
            <CardHeader>
              <CardTitle>Vorhandene Regeln ({rules.length})</CardTitle>
              <CardDescription>
                Regeln werden in der Reihenfolge angewendet
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {rules.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">
                    Noch keine Regeln vorhanden
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b text-left text-sm">
                          <th className="pb-3 font-medium">Muster</th>
                          <th className="pb-3 font-medium">Übereinstimmung</th>
                          <th className="pb-3 font-medium">Kategorie</th>
                          <th className="pb-3 font-medium">Aktionen</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rules.map((rule) => (
                          <tr key={rule.id} className="border-b">
                            <td className="py-3 text-sm font-mono">{rule.pattern}</td>
                            <td className="py-3 text-sm">
                              {matchTypeLabels[rule.match_type] || rule.match_type}
                            </td>
                            <td className="py-3 text-sm">
                              {getCategoryName(rule.category_id)}
                            </td>
                            <td className="py-3 text-sm">
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDeleteRule(rule.id)}
                                disabled={deleting === rule.id}
                              >
                                {deleting === rule.id ? "Löschen..." : "Löschen"}
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Helper Info */}
          <Card>
            <CardHeader>
              <CardTitle>Tipps für Regeln</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                <strong>Enthält:</strong> Sucht nach dem Muster überall in der Beschreibung
                (z.B. "REWE" findet "REWE Markt", "REWE Center")
              </p>
              <p>
                <strong>Beginnt mit:</strong> Beschreibung muss mit dem Muster beginnen
                (z.B. "AMAZON" findet "AMAZON.DE" aber nicht "Bei AMAZON")
              </p>
              <p>
                <strong>Exakt:</strong> Beschreibung muss genau dem Muster entsprechen
              </p>
              <p className="text-muted-foreground">
                Tipp: Verwenden Sie Großbuchstaben für Händlernamen, da die Suche nicht zwischen
                Groß- und Kleinschreibung unterscheidet
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
