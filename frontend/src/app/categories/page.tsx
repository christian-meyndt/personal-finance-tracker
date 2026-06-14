import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NavHeader } from "@/components/nav-header";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8000";

async function getCategories() {
  const cookieHeader = cookies()
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  const res = await fetch(`${BACKEND_URL}/api/v1/categories`, {
    headers: { cookie: cookieHeader },
    cache: "no-store",
  });

  if (!res.ok) return null;
  return res.json();
}

async function getUncategorizedCount() {
  const cookieHeader = cookies()
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  const res = await fetch(`${BACKEND_URL}/api/v1/transactions/uncategorized`, {
    headers: { cookie: cookieHeader },
    cache: "no-store",
  });

  if (!res.ok) return 0;
  const data = await res.json();
  return data.length;
}

export default async function CategoriesPage() {
  const categories = await getCategories();
  const uncategorizedCount = await getUncategorizedCount();

  if (!categories) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen">
      <NavHeader />
      <main className="p-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Categories</h1>
            {uncategorizedCount > 0 && (
              <span className="rounded-full bg-yellow-100 dark:bg-yellow-900 px-3 py-1 text-sm font-medium text-yellow-800 dark:text-yellow-200">
                {uncategorizedCount} uncategorized
              </span>
            )}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>All Categories</CardTitle>
            </CardHeader>
            <CardContent>
              {categories.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  No categories yet.
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
              <CardTitle>Categorization Rules</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Transactions are automatically categorized using pattern matching rules.
                When a transaction matches a rule, it's assigned to the corresponding category.
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium">17 active rules</span>
                  <span className="text-muted-foreground">
                    for common merchants and patterns
                  </span>
                </div>
                <div className="text-muted-foreground">
                  Examples: Amazon → Shopping, Netflix → Subscriptions, Lidl → Groceries
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
