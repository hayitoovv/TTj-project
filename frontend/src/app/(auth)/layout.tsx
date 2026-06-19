import Image from "next/image";
import Link from "next/link";

import { AuthShowcase } from "@/components/auth/showcase";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      {/* LEFT: form area */}
      <div className="flex flex-col">
        <header className="flex items-center justify-between px-6 py-5 lg:px-10">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Image src="/logo.png" alt="TTJ" width={36} height={36} priority />
            <span>TTJ Platforma</span>
          </Link>
          <Link
            href="/"
            className="text-sm text-muted-foreground transition hover:text-foreground"
          >
            ← Bosh sahifa
          </Link>
        </header>
        <main className="flex flex-1 items-center justify-center px-6 py-8 lg:px-10">
          <div className="w-full max-w-md">{children}</div>
        </main>
      </div>

      {/* RIGHT: showcase */}
      <AuthShowcase />
    </div>
  );
}
