"use client";
import { useRouter } from "next/navigation";
import { NeonAuthUIProvider } from "@neondatabase/auth-ui";
import { authClient } from "@/lib/auth/client";
import type { ReactNode } from "react";

export function AuthProviders({ children }: { children: ReactNode }) {
  const router = useRouter();
  return (
    <NeonAuthUIProvider
      authClient={authClient}
      navigate={router.push}
      replace={router.replace}
      redirectTo="/workspace"
      onSessionChange={() => router.refresh()}
    >
      {children}
    </NeonAuthUIProvider>
  );
}
