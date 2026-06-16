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
            <p className="text-muted-foreground">Loading charts...</p>
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
            <h1 className="text-3xl font-bold">Analytics</h1>
            <p className="text-muted-foreground mt-2">
              Visual insights into your spending patterns
            </p>
          </div>

          {/* Monthly Trend Line Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Income vs Expenses Trend</CardTitle>
              <CardDescription>
                Monthly income and expenses over the last 6 months
              </CardDescription>
            </CardHeader>
            <CardContent>
              {monthlyChartData.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No data available for monthly trend
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
                      name="Income"
                    />
                    <Line
                      type="monotone"
                      dataKey="expenses"
                      stroke="#ef4444"
                      strokeWidth={2}
                      name="Expenses"
                    />
                    <Line
                      type="monotone"
                      dataKey="net"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      name="Net"
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
                <CardTitle>Spending by Category</CardTitle>
                <CardDescription>
                  Distribution of expenses across categories
                </CardDescription>
              </CardHeader>
              <CardContent>
                {categoryPieData.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No expense data available
                  </p>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={categoryPieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percentage }) => `${name} (${percentage}%)`}
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
                <CardTitle>Budget vs Actual Spending</CardTitle>
                <CardDescription>
                  Current month budget limits compared to actual spending
                </CardDescription>
              </CardHeader>
              <CardContent>
                {budgetChartData.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No budgets set for this month
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
                      <Bar dataKey="spent" fill="#ef4444" name="Spent" />
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
                              {overBudget ? "OVER" : `${item.percentage}%`}
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
              <CardTitle>Key Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-lg border p-4">
                  <div className="text-sm text-muted-foreground mb-1">Top Spending Category</div>
                  {byCategory.length > 0 ? (
                    <>
                      <div className="text-2xl font-bold">{byCategory[0].category_name}</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {(byCategory[0].total / 100).toFixed(2)} € ({byCategory[0].percentage}%)
                      </div>
                    </>
                  ) : (
                    <div className="text-sm text-muted-foreground">No data</div>
                  )}
                </div>

                <div className="rounded-lg border p-4">
                  <div className="text-sm text-muted-foreground mb-1">Categories Tracked</div>
                  <div className="text-2xl font-bold">{byCategory.length}</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Active spending categories
                  </div>
                </div>

                <div className="rounded-lg border p-4">
                  <div className="text-sm text-muted-foreground mb-1">Budgets Set</div>
                  <div className="text-2xl font-bold">{budgetProgress.length}</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    For current month
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
