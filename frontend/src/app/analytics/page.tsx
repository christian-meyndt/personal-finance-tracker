"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { NavHeader } from "@/components/nav-header";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const COLORS = [
  "#3b82f6", // blue
  "#ef4444", // red
  "#10b981", // green
  "#f59e0b", // amber
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#f97316", // orange
];

export default function AnalyticsPage() {
  const [monthlyTrend, setMonthlyTrend] = useState<any[]>([]);
  const [byCategory, setByCategory] = useState<any[]>([]);
  const [budgetProgress, setBudgetProgress] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      // Load monthly trend
      const trendRes = await fetch("/api/backend/api/v1/analytics/monthly-trend?months=6", {
        credentials: "include",
      });
      if (trendRes.ok) {
        const data = await trendRes.json();
        setMonthlyTrend(data);
      }

      // Load by category
      const catRes = await fetch("/api/backend/api/v1/analytics/by-category", {
        credentials: "include",
      });
      if (catRes.ok) {
        const data = await catRes.json();
        setByCategory(data);
      }

      // Load budget progress
      const budgetRes = await fetch("/api/backend/api/v1/analytics/budget-progress", {
        credentials: "include",
      });
      if (budgetRes.ok) {
        const data = await budgetRes.json();
        setBudgetProgress(data);
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
            <p className="text-muted-foreground">Diagramme werden geladen...</p>
          </div>
        </main>
      </div>
    );
  }

  // Format monthly trend data for chart
  const monthlyChartData = monthlyTrend.map((item) => ({
    month: item.month,
    income: item.income / 100,
    expenses: item.expenses / 100,
    net: item.net / 100,
  }));

  // Format category data for pie chart
  const categoryPieData = byCategory.slice(0, 8).map((item) => ({
    name: item.category_name,
    value: item.total / 100,
    percentage: item.percentage,
  }));

  // Format budget data for bar chart
  const budgetChartData = budgetProgress.map((item) => ({
    name: item.category_name,
    budget: item.budget_amount / 100,
    spent: item.spent / 100,
    percentage: item.percentage,
  }));

  return (
    <div className="min-h-screen">
      <NavHeader />
      <main className="p-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Analysen</h1>
            <p className="text-muted-foreground mt-2">
              Visuelle Einblicke in Ihre Ausgabenmuster
            </p>
          </div>

          {/* Monthly Trend Line Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Einnahmen vs. Ausgaben Trend</CardTitle>
              <CardDescription>
                Monatliche Einnahmen und Ausgaben über die letzten 6 Monate
              </CardDescription>
            </CardHeader>
            <CardContent>
              {monthlyChartData.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Keine Daten für monatlichen Trend verfügbar
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip
                      formatter={(value: any) => `${value.toFixed(2)} €`}
                      contentStyle={{ backgroundColor: "rgba(255, 255, 255, 0.95)", border: "1px solid #ccc" }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="income"
                      stroke="#10b981"
                      strokeWidth={2}
                      name="Einnahmen"
                    />
                    <Line
                      type="monotone"
                      dataKey="expenses"
                      stroke="#ef4444"
                      strokeWidth={2}
                      name="Ausgaben"
                    />
                    <Line
                      type="monotone"
                      dataKey="net"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      name="Netto"
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Category Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Ausgaben nach Kategorie</CardTitle>
                <CardDescription>
                  Verteilung der Ausgaben über Kategorien
                </CardDescription>
              </CardHeader>
              <CardContent>
                {categoryPieData.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Keine Ausgabendaten verfügbar
                  </p>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={categoryPieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry: any) => `${entry.name} (${entry.percentage}%)`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {categoryPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: any) => `${value.toFixed(2)} €`}
                        contentStyle={{ backgroundColor: "rgba(255, 255, 255, 0.95)", border: "1px solid #ccc" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
                {categoryPieData.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {categoryPieData.map((item, index) => (
                      <div key={item.name} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span>{item.name}</span>
                        </div>
                        <span className="font-mono">{item.value.toFixed(2)} €</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Budget vs Actual Bar Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Budget vs. tatsächliche Ausgaben</CardTitle>
                <CardDescription>
                  Budgetgrenzen des aktuellen Monats im Vergleich zu tatsächlichen Ausgaben
                </CardDescription>
              </CardHeader>
              <CardContent>
                {budgetChartData.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Keine Budgets für diesen Monat festgelegt
                  </p>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={budgetChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip
                        formatter={(value: any) => `${value.toFixed(2)} €`}
                        contentStyle={{ backgroundColor: "rgba(255, 255, 255, 0.95)", border: "1px solid #ccc" }}
                      />
                      <Legend />
                      <Bar dataKey="budget" fill="#3b82f6" name="Budget" />
                      <Bar dataKey="spent" fill="#ef4444" name="Ausgegeben" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
                {budgetChartData.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {budgetChartData.map((item) => {
                      const remaining = item.budget - item.spent;
                      const overBudget = remaining < 0;
                      return (
                        <div key={item.name} className="flex items-center justify-between text-sm">
                          <span>{item.name}</span>
                          <div className="flex items-center gap-3">
                            <span className="font-mono">
                              {item.spent.toFixed(2)} / {item.budget.toFixed(2)} €
                            </span>
                            <span
                              className={`text-xs ${
                                overBudget ? "text-red-600" : "text-green-600"
                              }`}
                            >
                              {overBudget ? "ÜBER" : `${item.percentage}%`}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Summary Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Wichtige Erkenntnisse</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-lg border p-4">
                  <div className="text-sm text-muted-foreground mb-1">Top-Ausgabenkategorie</div>
                  {byCategory.length > 0 ? (
                    <>
                      <div className="text-2xl font-bold">{byCategory[0].category_name}</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {(byCategory[0].total / 100).toFixed(2)} € ({byCategory[0].percentage}%)
                      </div>
                    </>
                  ) : (
                    <div className="text-sm text-muted-foreground">Keine Daten</div>
                  )}
                </div>

                <div className="rounded-lg border p-4">
                  <div className="text-sm text-muted-foreground mb-1">Verfolgte Kategorien</div>
                  <div className="text-2xl font-bold">{byCategory.length}</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Aktive Ausgabenkategorien
                  </div>
                </div>

                <div className="rounded-lg border p-4">
                  <div className="text-sm text-muted-foreground mb-1">Festgelegte Budgets</div>
                  <div className="text-2xl font-bold">{budgetProgress.length}</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Für aktuellen Monat
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
