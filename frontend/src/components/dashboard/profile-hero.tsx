import { Sparkles } from "lucide-react";

import type { UserResponse } from "@/lib/api/types";

interface Stat {
  label: string;
  value: string | number;
}

interface ProfileHeroProps {
  user: UserResponse;
  stats: Stat[];
  premium?: boolean;
}

export function ProfileHero({ user, stats, premium = false }: ProfileHeroProps) {
  const name =
    `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim() || user.phone;
  const initial =
    (user.first_name?.[0] ?? user.last_name?.[0] ?? user.phone[user.phone.length - 1])
      ?.toString()
      .toUpperCase() ?? "U";

  return (
    <div className="overflow-hidden rounded-2xl border bg-card">
      <div className="grid items-center gap-6 p-6 sm:grid-cols-[auto_1fr] sm:p-8">
        {/* Avatar */}
        <div className="relative">
          {user.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.avatar_url}
              alt=""
              className="h-24 w-24 rounded-full object-cover ring-4 ring-background"
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 via-blue-600 to-yellow-400 text-3xl font-extrabold text-white ring-4 ring-background">
              {initial}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight md:text-3xl">{name}</h1>
          <div className="mt-2">
            <span
              className={
                premium
                  ? "inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 px-3 py-1 text-xs font-bold text-foreground shadow-sm"
                  : "inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700"
              }
            >
              {premium && <Sparkles className="h-3.5 w-3.5" />}
              {premium ? "Premium A'zo" : "Talaba"}
            </span>
          </div>
        </div>
      </div>

      <div className="border-t bg-muted/30">
        <dl className="grid grid-cols-2 divide-x divide-border sm:grid-cols-3">
          {stats.map((s) => (
            <div key={s.label} className="px-6 py-4">
              <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                {s.label}
              </dt>
              <dd className="mt-0.5 text-xl font-extrabold text-foreground sm:text-2xl">
                {s.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
