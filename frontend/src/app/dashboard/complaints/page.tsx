"use client";

import { Building2, Clock, Plus, ShieldAlert, ShieldCheck, User } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useComplaints } from "@/lib/api/hooks";
import type { ComplaintRead, ComplaintStatus } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth";

const FILTERS: { value: "all" | ComplaintStatus; label: string }[] = [
  { value: "all", label: "Hammasi" },
  { value: "new", label: "Yangi" },
  { value: "processing", label: "Jarayonda" },
  { value: "resolved", label: "Hal qilingan" },
];

const STATUS_META: Record<ComplaintStatus, { label: string; cls: string; icon: typeof Clock }> = {
  new: { label: "Yangi", cls: "bg-red-100 text-red-700 border-red-200", icon: ShieldAlert },
  processing: {
    label: "Jarayonda",
    cls: "bg-yellow-100 text-yellow-800 border-yellow-200",
    icon: Clock,
  },
  resolved: {
    label: "Hal qilingan",
    cls: "bg-green-100 text-green-700 border-green-200",
    icon: ShieldCheck,
  },
};

export default function ComplaintsPage() {
  const user = useAuthStore((s) => s.user);
  const isHandler = user?.role === "curator" || user?.role === "admin";
  const [filter, setFilter] = useState<"all" | ComplaintStatus>(isHandler ? "new" : "all");
  const { data, isLoading } = useComplaints({
    status: filter === "all" ? undefined : filter,
    page_size: 50,
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">
            {isHandler ? "Shikoyatlar" : "Mening shikoyatlarim"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {data?.total ?? 0} ta shikoyat
          </p>
        </div>
        {!isHandler && (
          <Button asChild className="shadow-md">
            <Link href="/dashboard/complaints/new">
              <Plus className="h-4 w-4" />
              Yangi shikoyat
            </Link>
          </Button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm font-medium transition",
              filter === f.value
                ? "border-primary bg-primary text-primary-foreground"
                : "border-input hover:bg-muted",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted/40" />
          ))}
        </div>
      ) : data?.items.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-muted/20 p-12 text-center">
          <ShieldAlert className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <h3 className="mt-4 text-lg font-semibold">
            {isHandler ? "Yangi shikoyatlar yo'q" : "Hali shikoyat yo'q"}
          </h3>
          {!isHandler && (
            <>
              <p className="mt-1 text-sm text-muted-foreground">
                Muammo bo&apos;lsa kuratorga murojaat qilishingiz mumkin.
              </p>
              <Button asChild className="mt-4">
                <Link href="/dashboard/complaints/new">
                  <Plus className="h-4 w-4" />
                  Yangi shikoyat
                </Link>
              </Button>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {data?.items.map((c) => <ComplaintRow key={c.id} complaint={c} isHandler={isHandler} />)}
        </div>
      )}
    </div>
  );
}

function ComplaintRow({
  complaint,
  isHandler,
}: {
  complaint: ComplaintRead;
  isHandler: boolean;
}) {
  const meta = STATUS_META[complaint.status];

  return (
    <Link
      href={`/dashboard/complaints/${complaint.id}`}
      className="block rounded-2xl border bg-card p-5 transition hover:shadow-md"
    >
      <div className="flex items-start gap-4">
        {isHandler && (
          <Avatar
            src={complaint.reporter.avatar_url}
            firstName={complaint.reporter.first_name}
            lastName={complaint.reporter.last_name}
            size="sm"
          />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-semibold leading-tight">{complaint.subject}</h3>
            <span
              className={cn(
                "inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-bold",
                meta.cls,
              )}
            >
              <meta.icon className="h-3 w-3" />
              {meta.label}
            </span>
          </div>
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{complaint.description}</p>

          {/* Context */}
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            {isHandler && (
              <span className="inline-flex items-center gap-1">
                <User className="h-3 w-3" />
                {`${complaint.reporter.first_name ?? ""} ${complaint.reporter.last_name ?? ""}`.trim() ||
                  complaint.reporter.phone}
              </span>
            )}
            {complaint.against_type === "house" && complaint.house_title && (
              <span className="inline-flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                {complaint.house_title}
              </span>
            )}
            {complaint.against_type === "user" && complaint.target_user_name && (
              <span className="inline-flex items-center gap-1">
                <User className="h-3 w-3" />
                {complaint.target_user_name}
              </span>
            )}
            <span className="ml-auto">
              {new Date(complaint.created_at).toLocaleDateString("uz-UZ")}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
