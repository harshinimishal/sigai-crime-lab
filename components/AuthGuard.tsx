"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { getCurrentUser } from "@/lib/auth";

type AuthGuardProps = {
  children: ReactNode;
};

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [isAllowed, setIsAllowed] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function checkSession() {
      const user = await getCurrentUser();

      if (!isMounted) {
        return;
      }

      if (!user) {
        router.replace("/");
        return;
      }

      setIsAllowed(true);
      setIsChecking(false);
    }

    checkSession();

    return () => {
      isMounted = false;
    };
  }, [router]);

  if (isChecking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white">
        <p className="text-sm uppercase tracking-[0.2em] text-zinc-400">
          Checking session...
        </p>
      </main>
    );
  }

  if (!isAllowed) {
    return null;
  }

  return children;
}
