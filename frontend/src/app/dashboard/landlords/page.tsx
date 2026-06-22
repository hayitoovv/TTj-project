"use client";

import {
  Ban,
  Calendar,
  Crown,
  Home,
  Mail,
  Phone,
  Search,
  ShieldAlert,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useState } from "react";

import { StartChatButton } from "@/components/chat/start-chat-button";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCuratorLandlords } from "@/lib/api/hooks";
import type { LandlordListFilter, LandlordListItem } from "@/lib/api/curator";
import { cn, formatPhone } from "@/lib/utils";

const FILTERS: { value: "all" | "pro" | "free" | "verified" | "blocked"; label: string }[] = [
  { value: "all", label: "Hammasi" },
  { value: "pro", label: "PRO" },
  { value: "free", label: "Bepul" },
  { value: "verified", label: "Tasdiqlangan" },
  { value: "blocked", label: "Bloklangan" },
];

export default function LandlordsPage() {
  const [filter, setFilter] = useState<"all" | "pro" | "free" | "verified" | "blocked">("all");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);

  const apiFilter: LandlordListFilter = {
    page,
    page_size: 20,
    q: searchInput.trim() || undefined,
    is_pro: filter === "pro" ? true : filter === "free" ? false : undefined,
    is_verified_landlord: filter === "verified" ? true : undefined,
    is_blocked: filter === "blocked" ? true : undefined,
  };

  const { data, isLoading } = useCuratorLandlords(apiFilter);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header>
        <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">
          Uy egalari <span className="text-gradient-brand">ro&apos;yxati</span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {data ? `Jami ${data.total} ta uy egasi` : "Yuklanmoqda..."}
        </p>
      </header>

      <div className="space-y-3">
        <form onSubmit={onSearch} className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Ism, telefon yoki email bo'yicha qidirish..."
            className="h-11 pl-10"
          />
        </form>

        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => {
                setFilter(f.value);
                setPage(1);
              }}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm font-medium transition",
                filter === f.value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-input hover:bg-muted",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-44 animate-pulse rounded-2xl bg-muted/40" />
          ))}
        </div>
      ) : data?.items.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-muted/20 p-12 text-center">
          <Users className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <h3 className="mt-4 text-lg font-semibold">Uy egalari topilmadi</h3>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {data?.items.map((l) => <LandlordCard key={l.id} landlord={l} />)}
        </div>
      )}

      {data && data.pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Oldingi
          </Button>
          <span className="text-sm text-muted-foreground">
            {page} / {data.pages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= data.pages}
            onClick={() => setPage((p) => p + 1)}
          >
            Keyingi
          </Button>
        </div>
      )}
    </div>
  );
}

function LandlordCard({ landlord }: { landlord: LandlordListItem }) {
  const name =
    `${landlord.first_name ?? ""} ${landlord.last_name ?? ""}`.trim() || landlord.phone;

  return (
    <article className="rounded-2xl border bg-card p-5 transition hover:shadow-md">
      <header className="flex items-start gap-3">
        <div className="relative shrink-0">
          <Avatar
            src={landlord.avatar_url}
            firstName={landlord.first_name}
            lastName={landlord.last_name}
            size="md"
            gradient="yellow-orange"
          />
          {landlord.is_pro && (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 text-white shadow-sm ring-2 ring-card">
              <Crown className="h-3 w-3" />
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate font-semibold">{name}</h3>
            {landlord.is_pro && (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 px-2 py-0.5 text-[10px] font-bold text-foreground shadow-sm">
                <Crown className="h-2.5 w-2.5" />
                PRO
              </span>
            )}
            {landlord.is_verified_landlord && (
              <ShieldCheck className="h-3.5 w-3.5 text-green-600" aria-label="Tasdiqlangan" />
            )}
            {landlord.is_blocked && (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-bold text-destructive">
                <Ban className="h-3 w-3" />
                Bloklangan
              </span>
            )}
          </div>
          <a
            href={`tel:${landlord.phone}`}
            className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <Phone className="h-3 w-3" />
            {formatPhone(landlord.phone)}
          </a>
          {landlord.email && (
            <a
              href={`mailto:${landlord.email}`}
              className="mt-0.5 ml-3 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <Mail className="h-3 w-3" />
              {landlord.email}
            </a>
          )}
        </div>
      </header>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <Stat
          icon={Home}
          value={landlord.houses_count}
          label="e'lon"
          color="text-blue-600"
        />
        <Stat
          icon={Calendar}
          value={landlord.active_bookings_count}
          label="faol bron"
          color="text-green-600"
        />
        <Stat
          icon={ShieldAlert}
          value={landlord.open_complaints_count}
          label="shikoyat"
          color={
            landlord.open_complaints_count > 0
              ? "text-red-600"
              : "text-muted-foreground"
          }
        />
      </div>

      <div className="mt-4">
        <StartChatButton
          peerId={landlord.id}
          label="Uy egasi bilan chat"
          variant="outline"
          size="default"
          fullWidth
        />
      </div>
    </article>
  );
}

function Stat({
  icon: Icon,
  value,
  label,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: number;
  label: string;
  color: string;
}) {
  return (
    <div className="rounded-lg border bg-background px-2 py-2">
      <div className={cn("inline-flex items-center gap-1 text-lg font-extrabold", color)}>
        <Icon className="h-3.5 w-3.5" />
        {value}
      </div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
    </div>
  );
}
