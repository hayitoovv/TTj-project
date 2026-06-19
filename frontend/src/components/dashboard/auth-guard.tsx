"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { getAccessToken } from "@/lib/api/client";
import type { UserRole } from "@/lib/api/types";
import { useAuthStore } from "@/stores/auth";

interface AuthGuardProps {
  children: React.ReactNode;
  roles?: UserRole[];
}

export function AuthGuard({ children, roles }: AuthGuardProps) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);
  const isLoading = useAuthStore((s) => s.isLoading);

  useEffect(() => {
    if (!hydrated) return;
    if (!user && !getAccessToken()) {
      router.replace("/login");
    } else if (user && roles && !roles.includes(user.role)) {
      router.replace("/");
    }
  }, [hydrated, user, roles, router]);

  if (!hydrated || isLoading || (!user && getAccessToken())) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) return null;
  if (roles && !roles.includes(user.role)) return null;

  return <>{children}</>;
}
