"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NavHeader } from "@/components/nav-header";
import { TransactionList } from "@/components/transaction-list-with-categories";

const PAGE_SIZE = 50;

export default function TransactionsPage() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [jumpToPage, setJumpToPage] = useState("");

  useEffect(() => {
    loadData();
  }, [currentPage]);

  async function loadData() {
    setLoading(true);
    try {
      // Fetch categories
      const catRes = await fetch("/api/backend/api/v1/categories", {
        credentials: "include",
      });
      if (catRes.ok) {
        const catData = await catRes.json();
        setCategories(catData);
      }

      // Fetch transactions with pagination
      const offset = (currentPage - 1) * PAGE_SIZE;
      const txnRes = await fetch(
        `/api/backend/api/v1/transactions?limit=${PAGE_SIZE}&offset=${offset}`,
        {
          credentials: "include",
        }
      );
      if (txnRes.ok) {
        const txnData = await txnRes.json();
        setTransactions(txnData);
      } else if (txnRes.status === 401) {
        router.push("/login");
      }

      // Get total count
      const countRes = await fetch("/api/backend/api/v1/transactions/count", {
        credentials: "include",
      });
      if (countRes.ok) {
        const countData = await countRes.json();
        setTotalCount(countData.count);
      }
    } catch (err) {
      console.error("Failed to load data:", err);
    } finally {
      setLoading(false);
    }
  }

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const handleJumpToPage = (e: React.FormEvent) => {
    e.preventDefault();
    const page = parseInt(jumpToPage);
    if (!isNaN(page) && page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      setJumpToPage("");
    }
  };

  if (loading && transactions.length === 0) {
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
            <h1 className="text-3xl font-bold">Transaktionen</h1>
            <div className="text-sm text-muted-foreground">
              {totalCount} Transaktionen insgesamt
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>
                Alle Transaktionen (Seite {currentPage} von {totalPages})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TransactionList
                transactions={transactions}
                categories={categories}
                onTransactionUpdate={(txnId, categoryId) => {
                  // Update transaction in place without reloading
                  setTransactions(prev =>
                    prev.map(txn =>
                      txn.id === txnId ? {...txn, category_id: categoryId} : txn
                    )
                  );
                }}
              />

              {/* Pagination Controls */}
              <div className="mt-6 border-t pt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1 || loading}
                  >
                    ← Vorherige
                  </Button>

                  <div className="flex items-center gap-2">
                    {currentPage > 2 && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(1)}
                        >
                          1
                        </Button>
                        {currentPage > 3 && <span className="text-muted-foreground">...</span>}
                      </>
                    )}

                    {currentPage > 1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(currentPage - 1)}
                      >
                        {currentPage - 1}
                      </Button>
                    )}

                    <Button variant="default" size="sm" disabled>
                      {currentPage}
                    </Button>

                    {currentPage < totalPages && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(currentPage + 1)}
                      >
                        {currentPage + 1}
                      </Button>
                    )}

                    {currentPage < totalPages - 1 && (
                      <>
                        {currentPage < totalPages - 2 && (
                          <span className="text-muted-foreground">...</span>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(totalPages)}
                        >
                          {totalPages}
                        </Button>
                      </>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages || loading}
                  >
                    Nächste →
                  </Button>
                </div>

                {/* Jump to page */}
                <form onSubmit={handleJumpToPage} className="flex items-center justify-center gap-2">
                  <span className="text-sm text-muted-foreground">Springe zu Seite:</span>
                  <input
                    type="number"
                    min="1"
                    max={totalPages}
                    value={jumpToPage}
                    onChange={(e) => setJumpToPage(e.target.value)}
                    placeholder={`1-${totalPages}`}
                    className="w-20 px-2 py-1 text-sm border rounded"
                  />
                  <Button type="submit" size="sm" variant="secondary" disabled={!jumpToPage}>
                    Los
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
