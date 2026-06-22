import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NavHeader } from "@/components/nav-header";
import { TransactionList } from "@/components/transaction-list";

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
            <TransactionList transactions={transactions} categories={categories} />
          </CardContent>
        </Card>
        </div>
      </main>
    </div>
  );
}
