"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Ban,
  CheckCircle2,
  GraduationCap,
  Home,
  Loader2,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  User as UserIcon,
} from "lucide-react";
import { useState } from "react";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { adminApi, type UserAdminListFilter, type UserAdminRead } from "@/lib/api/admin";
import { extractApiError } from "@/lib/api/client";
import { useAdminUsers } from "@/lib/api/hooks";
import type { UserRole } from "@/lib/api/types";
import { cn } from "@/lib/utils";

const ROLE_FILTERS: { value: UserRole | "all"; label: string; icon: typeof UserIcon }[] = [
  { value: "all", label: "Hammasi", icon: UserIcon },
  { value: "student", label: "Talabalar", icon: GraduationCap },
  { value: "landlord", label: "Uy egalari", icon: Home },
  { value: "curator", label: "Kuratorlar", icon: ShieldAlert },
  { value: "admin", label: "Adminlar", icon: Shield },
];

const ROLE_LABELS: Record<UserRole, string> = {
  student: "Talaba",
  landlord: "Uy egasi",
  curator: "Kurator",
  admin: "Admin",
};

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<UserAdminListFilter>({ page: 1, page_size: 20 });
  const [search, setSearch] = useState("");
  const [blockTarget, setBlockTarget] = useState<UserAdminRead | null>(null);
  const [reason, setReason] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  const { data, isLoading } = useAdminUsers(filter);

  const blockMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      adminApi.blockUser(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin"] });
      setBlockTarget(null);
      setReason("");
    },
    onError: (e) => setActionError(extractApiError(e)),
  });
  const unblockMutation = useMutation({
    mutationFn: (id: number) => adminApi.unblockUser(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin"] }),
    onError: (e) => setActionError(extractApiError(e)),
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilter((f) => ({ ...f, q: search.trim() || undefined, page: 1 }));
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">
          Foydalanuvchilar <span className="text-gradient-brand">boshqaruvi</span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {data ? `Jami ${data.total} ta foydalanuvchi` : "Yuklanmoqda..."}
        </p>
      </div>

      {/* Search + filter */}
      <div className="space-y-3">
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Telefon, ism yoki familiya bo'yicha qidirish..."
            className="h-11 pl-10"
          />
        </form>

        <div className="flex flex-wrap gap-2">
          {ROLE_FILTERS.map((rf) => (
            <button
              key={rf.value}
              type="button"
              onClick={() =>
                setFilter((f) => ({
                  ...f,
                  role: rf.value === "all" ? undefined : (rf.value as UserRole),
                  page: 1,
                }))
              }
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition",
                (rf.value === "all" && !filter.role) || filter.role === rf.value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-input hover:bg-muted",
              )}
            >
              <rf.icon className="h-3.5 w-3.5" />
              {rf.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() =>
              setFilter((f) => ({
                ...f,
                is_blocked: f.is_blocked === true ? undefined : true,
                page: 1,
              }))
            }
            className={cn(
              "ml-auto inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition",
              filter.is_blocked
                ? "border-destructive bg-destructive/10 text-destructive"
                : "border-input hover:bg-muted",
            )}
          >
            <Ban className="h-3.5 w-3.5" />
            Bloklangan
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border bg-card">
        {isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-14 animate-pulse rounded-lg bg-muted/40" />
            ))}
          </div>
        ) : data?.items.length === 0 ? (
          <div className="p-12 text-center">
            <UserIcon className="mx-auto h-10 w-10 text-muted-foreground/40" />
            <p className="mt-3 text-sm text-muted-foreground">Foydalanuvchilar topilmadi</p>
          </div>
        ) : (
          <ul className="divide-y">
            {data?.items.map((u) => (
              <UserRow
                key={u.id}
                user={u}
                onBlock={() => {
                  setActionError(null);
                  setBlockTarget(u);
                }}
                onUnblock={() => unblockMutation.mutate(u.id)}
                isUnblocking={unblockMutation.isPending}
              />
            ))}
          </ul>
        )}
      </div>

      {/* Pagination */}
      {data && data.pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={(filter.page ?? 1) <= 1}
            onClick={() => setFilter((f) => ({ ...f, page: (f.page ?? 1) - 1 }))}
          >
            Oldingi
          </Button>
          <span className="text-sm text-muted-foreground">
            Sahifa {filter.page} / {data.pages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={(filter.page ?? 1) >= data.pages}
            onClick={() => setFilter((f) => ({ ...f, page: (f.page ?? 1) + 1 }))}
          >
            Keyingi
          </Button>
        </div>
      )}

      {/* Block modal */}
      {blockTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border bg-background p-6 shadow-xl">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <Ban className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Foydalanuvchini bloklash</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {blockTarget.first_name} {blockTarget.last_name} ({blockTarget.phone})
                </p>
              </div>
            </div>
            <Label className="mt-5 block">Sabab</Label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="Sabab nima?"
              className="mt-1 w-full rounded-lg border border-input bg-card p-3 text-sm focus:border-destructive focus:outline-none focus:ring-4 focus:ring-destructive/15"
            />
            {actionError && (
              <p className="mt-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {actionError}
              </p>
            )}
            <div className="mt-5 flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setBlockTarget(null);
                  setReason("");
                }}
              >
                Bekor
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                disabled={reason.trim().length < 3 || blockMutation.isPending}
                onClick={() =>
                  blockMutation.mutate({ id: blockTarget.id, reason: reason.trim() })
                }
              >
                {blockMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Bloklash
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function UserRow({
  user,
  onBlock,
  onUnblock,
  isUnblocking,
}: {
  user: UserAdminRead;
  onBlock: () => void;
  onUnblock: () => void;
  isUnblocking: boolean;
}) {
  const name = `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim() || "—";

  return (
    <li className="flex items-center gap-4 px-4 py-3 transition hover:bg-muted/30">
      <Avatar
        src={user.avatar_url}
        firstName={user.first_name}
        lastName={user.last_name}
        size="sm"
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate font-semibold">{name}</p>
          <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
            {ROLE_LABELS[user.role]}
          </span>
          {user.is_verified && (
            <ShieldCheck className="h-3.5 w-3.5 text-green-600" />
          )}
          {user.is_blocked && (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-bold text-destructive">
              <Ban className="h-3 w-3" />
              Bloklangan
            </span>
          )}
        </div>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {user.phone} {user.email && ` · ${user.email}`}
        </p>
      </div>
      <div className="flex shrink-0 gap-2">
        {user.role !== "admin" &&
          (user.is_blocked ? (
            <Button
              size="sm"
              variant="outline"
              onClick={onUnblock}
              disabled={isUnblocking}
              className="text-green-600"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Tiklash
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={onBlock}
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <Ban className="h-3.5 w-3.5" />
              Bloklash
            </Button>
          ))}
      </div>
    </li>
  );
}
