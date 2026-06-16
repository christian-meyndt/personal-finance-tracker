import Link from "next/link";
import { SignOutButton } from "@/components/sign-out-button";

export function NavHeader() {
  return (
    <header className="border-b">
      <div className="mx-auto max-w-7xl px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-lg font-semibold hover:text-primary">
              Finanztracker
            </Link>
            <nav className="flex gap-4 text-sm">
              <Link href="/dashboard" className="text-muted-foreground hover:text-foreground">
                Dashboard
              </Link>
              <Link href="/analytics" className="text-muted-foreground hover:text-foreground">
                Analysen
              </Link>
              <Link href="/transactions" className="text-muted-foreground hover:text-foreground">
                Transaktionen
              </Link>
              <Link href="/categories" className="text-muted-foreground hover:text-foreground">
                Kategorien
              </Link>
              <Link href="/budgets" className="text-muted-foreground hover:text-foreground">
                Budgets
              </Link>
              <Link href="/import" className="text-muted-foreground hover:text-foreground">
                Import
              </Link>
              <Link href="/settings" className="text-muted-foreground hover:text-foreground">
                Einstellungen
              </Link>
            </nav>
          </div>
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}
