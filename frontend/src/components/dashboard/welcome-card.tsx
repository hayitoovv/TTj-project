import Image from "next/image";

import type { UserResponse } from "@/lib/api/types";

export function WelcomeCard({ user }: { user: UserResponse }) {
  const name = user.first_name ?? "Talaba";
  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Xayrli tong";
    if (h < 18) return "Salom";
    return "Xayrli kech";
  })();

  return (
    <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-blue-600 via-blue-500 to-yellow-400 p-6 text-white shadow-lg sm:p-8">
      <div className="pointer-events-none absolute -right-8 -top-8 h-44 w-44 rounded-full bg-white/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-12 -left-8 h-44 w-44 rounded-full bg-yellow-300/25 blur-3xl" />

      <div className="relative flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-wider text-white/80">
            {greeting},
          </p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight md:text-4xl">
            {name}! 👋
          </h1>
          <p className="mt-2 max-w-md text-sm text-white/85">
            TTJ Platformaga xush kelibsiz. Sizning ijara safarinigiz shu yerda boshlanadi.
          </p>
        </div>
        <Image
          src="/logo.png"
          alt=""
          width={84}
          height={84}
          className="hidden opacity-30 sm:block"
        />
      </div>
    </div>
  );
}
