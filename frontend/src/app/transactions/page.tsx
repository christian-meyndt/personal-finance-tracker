import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NavHeader } from "@/components/nav-header";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8000";

async function getTransactions() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
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
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
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
    <div className="min-h-screen">
      <NavHeader />
      <main className="p-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <h1 className="text-3xl font-bold">Transaktionen</h1>

        <Card>
          <CardHeader>
            <CardTitle>Alle Transaktionen</CardTitle>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                Noch keine Transaktionen. Importieren Sie eine CSV-Datei, um zu beginnen.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left text-sm">
                      <th className="pb-3 font-medium">Datum</th>
                      <th className="pb-3 font-medium">Beschreibung</th>
                      <th className="pb-3 font-medium">Gegenseite</th>
                      <th className="pb-3 font-medium text-right">Betrag</th>
                      <th className="pb-3 font-medium">Kategorie</th>
                      <th className="pb-3 font-medium">Quelle</th>
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
                              <span className="text-xs text-muted-foreground">Nicht kategorisiert</span>
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
          {transactions.length} Transaktionen angezeigt
        </div>
        </div>
      </main>
    </div>
  );
}
