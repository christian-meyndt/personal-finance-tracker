"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { NavHeader } from "@/components/nav-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<any[]>([]);
  const [progress, setProgress] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // Form state
  const [selectedCategory, setSelectedCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);

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
        const data = await catRes.json();
        setCategories(data);
      }

      // Load budget progress
      const progressRes = await fetch("/api/backend/api/v1/analytics/budget-progress", {
        credentials: "include",
      });
      if (progressRes.ok) {
        const data = await progressRes.json();
        setProgress(data);
      }

      // Load all budgets
      const budgetRes = await fetch("/api/backend/api/v1/budgets", {
        credentials: "include",
      });
      if (budgetRes.ok) {
        const data = await budgetRes.json();
        setBudgets(data);
      }
    } catch (err) {
      console.error("Failed to load data:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateBudget(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCategory || !amount) return;

    setCreating(true);
    try {
      const res = await fetch("/api/backend/api/v1/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          category_id: parseInt(selectedCategory),
          amount_cents: Math.round(parseFloat(amount) * 100),
          year,
          month,
        }),
      });

      if (res.ok) {
        // Reset form
        setSelectedCategory("");
        setAmount("");
        // Reload data
        await loadData();
      }
    } catch (err) {
      console.error("Failed to create budget:", err);
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
            <p className="text-muted-foreground">Budgets werden geladen...</p>
          </div>
        </main>
      </div>
    );
  }

  const currentDate = new Date();
  const monthName = currentDate.toLocaleString('de-DE', { month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen">
      <NavHeader />
      <main className="p-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Budgets</h1>
            <p className="text-muted-foreground mt-2">
              Ausgaben gegenüber monatlichen Budgetgrenzen verfolgen
            </p>
          </div>

          {/* Current Month Progress */}
          {progress.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{monthName} - Budgetfortschritt</CardTitle>
                <CardDescription>
                  Ihre Ausgaben diesen Monat im Vergleich zu Budgetgrenzen
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {progress.map((item) => {
                    const budgetAmount = item.budget_amount / 100;
                    const spent = item.spent / 100;
                    const remaining = item.remaining / 100;

                    return (
                      <div key={item.budget_id}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{item.category_icon}</span>
                            <span className="font-medium">{item.category_name}</span>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-mono">
                              <span className={item.over_budget ? "text-red-600" : ""}>
                                {spent.toFixed(2)} €
                              </span>
                              {" / "}
                              {budgetAmount.toFixed(2)} €
                            </div>
                            <div className={`text-xs ${
                              item.over_budget ? "text-red-600" : "text-muted-foreground"
                            }`}>
                              {item.over_budget ? (
                                <>Überschritten um {Math.abs(remaining).toFixed(2)} €</>
                              ) : (
                                <>{remaining.toFixed(2)} € verbleibend</>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="w-full bg-muted rounded-full h-3">
                          <div
                            className={`rounded-full h-3 transition-all ${
                              item.over_budget ? "bg-red-500" : "bg-green-500"
                            }`}
                            style={{ width: `${Math.min(item.percentage, 100)}%` }}
                          />
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {item.percentage}% verwendet
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {progress.length === 0 && (
            <Card>
              <CardContent className="py-8">
                <div className="text-center">
                  <p className="text-muted-foreground">
                    Keine Budgets für {monthName} festgelegt
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Erstellen Sie unten ein Budget, um Ihre Ausgaben zu verfolgen
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Create Budget */}
          <Card>
            <CardHeader>
              <CardTitle>Budget erstellen</CardTitle>
              <CardDescription>
                Legen Sie ein Ausgabenlimit für eine Kategorie fest
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateBudget} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="category">Kategorie</Label>
                    <select
                      id="category"
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      required
                    >
                      <option value="">Kategorie auswählen</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.icon} {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="amount">Budgetbetrag (€)</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="500.00"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="year">Jahr</Label>
                    <Input
                      id="year"
                      type="number"
                      min="2020"
                      max="2099"
                      value={year}
                      onChange={(e) => setYear(parseInt(e.target.value))}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="month">Monat</Label>
                    <select
                      id="month"
                      value={month}
                      onChange={(e) => setMonth(parseInt(e.target.value))}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      required
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                        <option key={m} value={m}>
                          {new Date(2000, m - 1).toLocaleString('de-DE', { month: 'long' })}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <Button type="submit" disabled={creating}>
                  {creating ? "Erstelle..." : "Budget erstellen"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* All Budgets */}
          {budgets.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Alle Budgets</CardTitle>
                <CardDescription>
                  Alle Budgetgrenzen über alle Monate hinweg anzeigen
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {budgets.map((budget) => {
                    const amount = budget.amount_cents / 100;
                    const category = categories.find((c) => c.id === budget.category_id);
                    const monthName = new Date(budget.year, budget.month - 1).toLocaleString('de-DE', {
                      month: 'short',
                      year: 'numeric'
                    });

                    return (
                      <div
                        key={budget.id}
                        className="flex items-center justify-between border-b pb-2 last:border-b-0"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{category?.icon || "💰"}</span>
                          <div>
                            <p className="text-sm font-medium">
                              {category?.name || "Unknown"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {monthName}
                            </p>
                          </div>
                        </div>
                        <div className="text-sm font-mono">
                          {amount.toFixed(2)} €
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
