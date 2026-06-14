import Link from "next/link";
import { SignOutButton } from "@/components/sign-out-button";

export function NavHeader() {
  return (
    <header className="border-b">
      <div className="mx-auto max-w-7xl px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-lg font-semibold hover:text-primary">
              Personal Finance Tracker
            </Link>
            <nav className="flex gap-4 text-sm">
              <Link href="/transactions" className="text-muted-foreground hover:text-foreground">
                Transactions
              </Link>
              <Link href="/categories" className="text-muted-foreground hover:text-foreground">
                Categories
              </Link>
              <Link href="/import" className="text-muted-foreground hover:text-foreground">
                Import
              </Link>
            </nav>
          </div>
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}
