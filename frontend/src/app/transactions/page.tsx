import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8000";

async function getTransactions() {
  const cookieHeader = cookies()
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  const res = await fetch(`${BACKEND_URL}/api/v1/transactions?limit=100`, {
    headers: { cookie: cookieHeader },
    cache: "no-store",
  });

  if (!res.ok) return null;
  return res.json();
}

async function getCategories() {
  const cookieHeader = cookies()
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  const res = await fetch(`${BACKEND_URL}/api/v1/categories`, {
    headers: { cookie: cookieHeader },
    cache: "no-store",
  });

  if (!res.ok) return [];
  return res.json();
}

export default async function TransactionsPage() {
  const transactions = await getTransactions();
  const categories = await getCategories();

  if (!transactions) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Transactions</h1>
          <a
            href="/import"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Import CSV
          </a>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                No transactions yet. Import a CSV file to get started.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left text-sm">
                      <th className="pb-3 font-medium">Date</th>
                      <th className="pb-3 font-medium">Description</th>
                      <th className="pb-3 font-medium">Counterparty</th>
                      <th className="pb-3 font-medium text-right">Amount</th>
                      <th className="pb-3 font-medium">Category</th>
                      <th className="pb-3 font-medium">Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((txn: any) => {
                      const amount = txn.amount_cents / 100;
                      const isExpense = amount < 0;
                      const category = categories.find((c: any) => c.id === txn.category_id);

                      return (
                        <tr key={txn.id} className="border-b text-sm">
                          <td className="py-3">{txn.date}</td>
                          <td className="py-3 max-w-xs truncate">{txn.description || "-"}</td>
                          <td className="py-3 max-w-xs truncate">{txn.counterparty || "-"}</td>
                          <td className={`py-3 text-right font-mono ${isExpense ? "text-red-600" : "text-green-600"}`}>
                            {amount.toFixed(2)} €
                          </td>
                          <td className="py-3">
                            {category ? (
                              <span className="inline-flex items-center gap-1">
                                {category.icon && <span>{category.icon}</span>}
                                <span className="text-xs">{category.name}</span>
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">Uncategorized</span>
                            )}
                          </td>
                          <td className="py-3">
                            <span className="text-xs rounded-full bg-muted px-2 py-1">
                              {txn.source || "manual"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="text-sm text-muted-foreground">
          Showing {transactions.length} transactions
        </div>
      </div>
    </main>
  );
}
