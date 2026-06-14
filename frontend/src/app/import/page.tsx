"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ImportPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("account_id", "1"); // Default to account 1 for now

      const res = await fetch("/api/backend/api/v1/import/csv", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || "Import failed");
      }

      const data = await res.json();
      setResult(data);

      // Redirect to transactions after 2 seconds
      setTimeout(() => {
        router.push("/transactions");
      }, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <main className="min-h-screen p-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Import Transactions</h1>
          <p className="text-muted-foreground mt-2">
            Upload a CSV file from your bank (DKB, Hanseatic Bank, or Openbank)
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>CSV Upload</CardTitle>
            <CardDescription>
              Supported formats: DKB, Hanseatic Bank, Openbank
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="file">CSV File</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".csv"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Select a CSV export from your bank
                </p>
              </div>

              {error && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              {result && (
                <div className="rounded-md bg-green-50 dark:bg-green-950 p-4 space-y-2">
                  <p className="font-medium text-green-900 dark:text-green-100">
                    Import Successful! 🎉
                  </p>
                  <div className="text-sm text-green-800 dark:text-green-200">
                    <p>Bank format detected: <strong>{result.bank}</strong></p>
                    <p>Imported: <strong>{result.imported}</strong> new transactions</p>
                    <p>Skipped: <strong>{result.skipped}</strong> duplicates</p>
                    <p>Total: <strong>{result.total}</strong> transactions processed</p>
                  </div>
                  <p className="text-xs text-green-700 dark:text-green-300 mt-2">
                    Redirecting to transactions list...
                  </p>
                </div>
              )}

              <Button type="submit" disabled={!file || uploading} className="w-full">
                {uploading ? "Uploading..." : "Upload & Import"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-sm text-muted-foreground space-y-2">
          <p className="font-medium">Supported Banks:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>DKB (Deutsche Kreditbank) - German format with semicolon delimiter</li>
            <li>Hanseatic Bank - Credit card statements</li>
            <li>Openbank - Spanish bank with flexible format</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
