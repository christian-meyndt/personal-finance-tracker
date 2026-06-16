"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NavHeader } from "@/components/nav-header";

export default function DashboardPage() {
  const [summary, setSummary] = useState<any>(null);
  const [byCategory, setByCategory] = useState<any[]>([]);
  const [recent, setRecent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      // Load summary
      const summaryRes = await fetch("/api/backend/api/v1/analytics/summary", {
        credentials: "include",
      });
      if (summaryRes.ok) {
        const data = await summaryRes.json();
        setSummary(data);
      }

      // Load by category
      const catRes = await fetch("/api/backend/api/v1/analytics/by-category", {
        credentials: "include",
      });
      if (catRes.ok) {
        const data = await catRes.json();
        setByCategory(data.slice(0, 5)); // Top 5
      }

      // Load recent transactions
      const recentRes = await fetch("/api/backend/api/v1/analytics/recent?limit=5", {
        credentials: "include",
      });
      if (recentRes.ok) {
        const data = await recentRes.json();
        setRecent(data);
      }
    } catch (err) {
      console.error("Failed to load data:", err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <NavHeader />
        <main className="p-8">
          <div className="mx-auto max-w-7xl">
            <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
        </main>
      </div>
    );
  }

  const income = summary ? summary.total_income / 100 : 0;
  const expenses = summary ? summary.total_expenses / 100 : 0;
  const net = summary ? summary.net / 100 : 0;

  return (
    <div className="min-h-screen">
      <NavHeader />
      <main className="p-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              All time summary
            </p>
          </div>

          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Income</CardTitle>
                <span className="text-2xl">💰</span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  +{income.toFixed(2)} €
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {summary?.transaction_count || 0} transactions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                <span className="text-2xl">💸</span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  -{expenses.toFixed(2)} €
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Across all categories
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Net Balance</CardTitle>
                <span className="text-2xl">📊</span>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {net >= 0 ? '+' : ''}{net.toFixed(2)} €
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Income minus expenses
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Spending by Category */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Top Spending Categories</CardTitle>
                  <Link href="/categories" className="text-xs text-muted-foreground hover:text-foreground">
                    View all →
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {byCategory.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No expenses yet
                  </p>
                ) : (
                  <div className="space-y-4">
                    {byCategory.map((cat) => {
                      const amount = cat.total / 100;
                      return (
                        <div key={cat.category_id || 'uncategorized'}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{cat.category_icon}</span>
                              <span className="text-sm font-medium">{cat.category_name}</span>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-mono">
                                {amount.toFixed(2)} €
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {cat.percentage}%
                              </div>
                            </div>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div
                              className="bg-primary rounded-full h-2 transition-all"
                              style={{ width: `${Math.min(cat.percentage, 100)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Transactions */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Recent Transactions</CardTitle>
                  <Link href="/transactions" className="text-xs text-muted-foreground hover:text-foreground">
                    View all →
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {recent.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No transactions yet
                  </p>
                ) : (
                  <div className="space-y-3">
                    {recent.map((txn) => {
                      const amount = txn.amount_cents / 100;
                      const isExpense = amount < 0;
                      return (
                        <div
                          key={txn.id}
                          className="flex items-center justify-between border-b pb-3 last:border-b-0"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              {txn.category_icon && (
                                <span className="text-sm">{txn.category_icon}</span>
                              )}
                              <p className="text-sm font-medium truncate">
                                {txn.counterparty || txn.description || "Unknown"}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <p className="text-xs text-muted-foreground">
                                {txn.date}
                              </p>
                              {txn.category_name && (
                                <>
                                  <span className="text-xs text-muted-foreground">•</span>
                                  <p className="text-xs text-muted-foreground">
                                    {txn.category_name}
                                  </p>
                                </>
                              )}
                            </div>
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
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-5">
                <Link
                  href="/analytics"
                  className="rounded-lg border p-4 hover:bg-muted/50 transition-colors text-center"
                >
                  <div className="text-2xl mb-2">📊</div>
                  <div className="text-sm font-medium">Analytics</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    View charts
                  </div>
                </Link>
                <Link
                  href="/import"
                  className="rounded-lg border p-4 hover:bg-muted/50 transition-colors text-center"
                >
                  <div className="text-2xl mb-2">📥</div>
                  <div className="text-sm font-medium">Import</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Add transactions
                  </div>
                </Link>
                <Link
                  href="/transactions"
                  className="rounded-lg border p-4 hover:bg-muted/50 transition-colors text-center"
                >
                  <div className="text-2xl mb-2">💳</div>
                  <div className="text-sm font-medium">Transactions</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    View all
                  </div>
                </Link>
                <Link
                  href="/categories"
                  className="rounded-lg border p-4 hover:bg-muted/50 transition-colors text-center"
                >
                  <div className="text-2xl mb-2">🏷️</div>
                  <div className="text-sm font-medium">Categories</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Manage rules
                  </div>
                </Link>
                <Link
                  href="/budgets"
                  className="rounded-lg border p-4 hover:bg-muted/50 transition-colors text-center"
                >
                  <div className="text-2xl mb-2">🎯</div>
                  <div className="text-sm font-medium">Budgets</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Track spending
                  </div>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
