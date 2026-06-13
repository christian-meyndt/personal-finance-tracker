"use client";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

export function SignOutButton() {
  const router = useRouter();

  async function onClick() {
    await fetch("/api/backend/api/v1/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    router.push("/login");
    router.refresh();
  }

  return (
    <Button variant="outline" onClick={onClick}>
      Sign out
    </Button>
  );
}
