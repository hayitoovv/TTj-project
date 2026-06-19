"use client";

import { Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { UserMenu } from "@/components/dashboard/user-menu";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth";

export function Navbar() {
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith("/dashboard") ?? false;

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-background/70 backdrop-blur-xl">
      <div
        className={
          isDashboard
            ? "flex h-16 items-center justify-between px-4 md:px-6"
            : "container mx-auto flex h-16 max-w-6xl items-center justify-between px-4"
        }
      >
        <Link href={isDashboard ? "/dashboard" : "/"} className="flex items-center gap-2 font-semibold">
          <Image src="/logo.png" alt="TTJ" width={36} height={36} priority />
          <span className="text-lg">
            TTJ <span className="text-muted-foreground font-normal">Platforma</span>
          </span>
        </Link>

        {!isDashboard && (
          <nav className="hidden items-center gap-8 text-sm font-medium md:flex">
            <Link
              href="/#features"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Imkoniyatlar
            </Link>
            <Link
              href="/#how"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Qanday ishlaydi
            </Link>
            <Link
              href="/#pricing"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Narxlar
            </Link>
            <Link
              href="/houses"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Uylar
            </Link>
          </nav>
        )}

        <div className="flex items-center gap-2">
          {isDashboard && user && (
            <Link
              href="/houses"
              className="hidden items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-sm text-muted-foreground transition hover:text-foreground md:inline-flex"
            >
              <Search className="h-3.5 w-3.5" />
              Uy qidirish
            </Link>
          )}
          <NotificationBell enabled={hydrated && !!user} />
          {hydrated && user ? (
            <UserMenu user={user} />
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">Kirish</Link>
              </Button>
              <Button asChild size="sm" className="shadow-sm">
                <Link href="/register">Boshlash</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
