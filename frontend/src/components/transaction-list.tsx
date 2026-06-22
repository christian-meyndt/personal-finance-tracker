"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface Transaction {
  id: number;
  date: string;
  amount_cents: number;
  description: string;
  counterparty: string | null;
  category_id: number | null;
  source: string;
}

interface Category {
  id: number;
  name: string;
  icon: string | null;
  color: string | null;
}

interface TransactionListProps {
  transactions: Transaction[];
  categories: Category[];
}

export function TransactionList({ transactions, categories }: TransactionListProps) {
  const [hideTransfers, setHideTransfers] = useState(true);

  // Find Transfer category ID
  const transferCategory = categories.find((cat) => cat.name === "Transfer");
  const transferCategoryId = transferCategory?.id;

  // Filter transactions
  const filteredTransactions = hideTransfers
    ? transactions.filter((txn) => txn.category_id !== transferCategoryId)
    : transactions;

  const transferCount = transactions.filter(
    (txn) => txn.category_id === transferCategoryId
  ).length;

  const categoryMap = new Map(categories.map((cat) => [cat.id, cat]));

  const formatSource = (source: string) => {
    const sourceMap: { [key: string]: string } = {
      csv_dkb: "DKB",
      csv_paypal: "PayPal",
      csv_hanseatic: "Hanseatic",
      csv_openbank: "Openbank",
      paypal: "PayPal API",
      manual: "Manuell",
    };
    return sourceMap[source] || source;
  };

  return (
    <div className="space-y-4">
      {/* Filter Toggle */}
      <div className="flex items-center justify-between rounded-lg border p-4">
        <div className="space-y-0.5">
          <Label htmlFor="hide-transfers" className="text-base">
            Interne Überweisungen ausblenden
          </Label>
          <p className="text-sm text-muted-foreground">
            {transferCount} interne Überweisungen zwischen DKB und PayPal
          </p>
        </div>
        <Switch
          id="hide-transfers"
          checked={hideTransfers}
          onCheckedChange={setHideTransfers}
        />
      </div>

      {/* Transaction Count */}
      <div className="text-sm text-muted-foreground">
        {filteredTransactions.length} Transaktionen
        {hideTransfers && transferCount > 0 && ` (${transferCount} ausgeblendet)`}
      </div>

      {/* Transactions Table */}
      {filteredTransactions.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground">
          {hideTransfers && transferCount > 0
            ? "Alle Transaktionen sind interne Überweisungen. Deaktivieren Sie den Filter, um sie anzuzeigen."
            : "Noch keine Transaktionen. Importieren Sie eine CSV-Datei, um zu beginnen."}
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
              {filteredTransactions.map((txn) => {
                const amount = txn.amount_cents / 100;
                const isExpense = amount < 0;
                const category = txn.category_id
                  ? categoryMap.get(txn.category_id)
                  : null;

                return (
                  <tr key={txn.id} className="border-b">
                    <td className="py-3 text-sm">{txn.date}</td>
                    <td className="py-3 text-sm">{txn.description}</td>
                    <td className="py-3 text-sm text-muted-foreground">
                      {txn.counterparty || "-"}
                    </td>
                    <td
                      className={`py-3 text-right text-sm font-medium ${
                        isExpense ? "text-red-600" : "text-green-600"
                      }`}
                    >
                      {amount > 0 ? "+" : ""}
                      {amount.toFixed(2)} €
                    </td>
                    <td className="py-3 text-sm">
                      {category ? (
                        <span className="inline-flex items-center gap-1">
                          {category.icon && <span>{category.icon}</span>}
                          {category.name}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">
                          Nicht kategorisiert
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-sm text-muted-foreground">
                      {formatSource(txn.source)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
