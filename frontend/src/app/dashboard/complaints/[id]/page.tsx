"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Clock,
  Loader2,
  PlayCircle,
  ShieldAlert,
  ShieldCheck,
  User,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { extractApiError } from "@/lib/api/client";
import { complaintsApi } from "@/lib/api/complaints";
import { useComplaint } from "@/lib/api/hooks";
import type { ComplaintStatus } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth";

const STATUS_META: Record<ComplaintStatus, { label: string; cls: string }> = {
  new: { label: "Yangi", cls: "bg-red-100 text-red-700 border-red-200" },
  processing: { label: "Jarayonda", cls: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  resolved: { label: "Hal qilingan", cls: "bg-green-100 text-green-700 border-green-200" },
};

export default function ComplaintDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const { data: c, isLoading } = useComplaint(Number.isFinite(id) ? id : null);

  const [resolution, setResolution] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  const processMutation = useMutation({
    mutationFn: () => complaintsApi.process(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["complaints"] }),
    onError: (e) => setActionError(extractApiError(e)),
  });
  const resolveMutation = useMutation({
    mutationFn: (text: string) => complaintsApi.resolve(id, text),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["complaints"] });
      setResolution("");
    },
    onError: (e) => setActionError(extractApiError(e)),
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!c) {
    return (
      <div className="text-center py-20">
        <p>Shikoyat topilmadi.</p>
      </div>
    );
  }

  const meta = STATUS_META[c.status];
  const isHandler = user?.role === "curator" || user?.role === "admin";
  const canProcess = isHandler && c.status === "new";
  const canResolve = isHandler && c.status !== "resolved";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/dashboard/complaints"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Shikoyatlarga qaytish
      </Link>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Shikoyat #{c.id}</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight">{c.subject}</h1>
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-bold",
            meta.cls,
          )}
        >
          <ShieldAlert className="h-3.5 w-3.5" />
          {meta.label}
        </span>
      </div>

      {/* Timeline */}
      <div className="rounded-2xl border bg-card p-5">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Jarayon
        </h2>
        <ol className="space-y-3">
          <TimelineStep
            done
            label="Yaratildi"
            date={new Date(c.created_at).toLocaleString("uz-UZ")}
            icon={ShieldAlert}
          />
          <TimelineStep
            done={c.status !== "new"}
            label="Kurator ish boshladi"
            icon={PlayCircle}
          />
          <TimelineStep
            done={c.status === "resolved"}
            label="Hal qilindi"
            date={c.resolved_at ? new Date(c.resolved_at).toLocaleString("uz-UZ") : undefined}
            icon={CheckCircle2}
          />
        </ol>
      </div>

      {/* Details */}
      <div className="rounded-2xl border bg-card p-5">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Tafsilotlar
        </h2>
        <p className="whitespace-pre-line text-sm">{c.description}</p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {c.house_title && (
            <InfoRow icon={Building2} label="Uy" value={c.house_title} />
          )}
          {c.target_user_name && (
            <InfoRow icon={User} label="Foydalanuvchi" value={c.target_user_name} />
          )}
          {c.booking_id && (
            <InfoRow icon={Clock} label="Bron" value={`#${c.booking_id}`} />
          )}
        </div>
      </div>

      {/* Resolution display */}
      {c.resolution && (
        <div className="overflow-hidden rounded-2xl border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-500 text-white">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold uppercase tracking-wider text-green-700">
                Kurator javobi
              </p>
              <p className="mt-2 whitespace-pre-line text-sm">{c.resolution}</p>
              {c.resolved_at && (
                <p className="mt-2 text-xs text-muted-foreground">
                  {new Date(c.resolved_at).toLocaleString("uz-UZ")}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reporter info (for handler) */}
      {isHandler && (
        <div className="rounded-2xl border bg-card p-5">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Murojaat qiluvchi
          </h2>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-yellow-400 text-white font-bold">
              {(c.reporter.first_name?.[0] ?? c.reporter.last_name?.[0] ?? "U").toUpperCase()}
            </div>
            <div>
              <p className="font-semibold">
                {`${c.reporter.first_name ?? ""} ${c.reporter.last_name ?? ""}`.trim() ||
                  c.reporter.phone}
              </p>
              <p className="text-xs text-muted-foreground">{c.reporter.phone}</p>
            </div>
          </div>
        </div>
      )}

      {/* Curator actions */}
      {isHandler && c.status !== "resolved" && (
        <div className="rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white p-5">
          <h2 className="font-bold">Kurator harakatlari</h2>

          {actionError && (
            <p className="mt-3 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {actionError}
            </p>
          )}

          <div className="mt-4 space-y-3">
            {canProcess && (
              <Button
                onClick={() => processMutation.mutate()}
                disabled={processMutation.isPending}
                variant="outline"
                className="w-full"
              >
                {processMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <PlayCircle className="h-4 w-4" />
                )}
                Ish boshlash (Jarayonda)
              </Button>
            )}

            {canResolve && (
              <div>
                <Label className="mb-2 block">Yechim/javob</Label>
                <textarea
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  rows={4}
                  placeholder="Muammo qanday hal qilindi? Murojaat qiluvchiga javob..."
                  className="mb-2 w-full rounded-lg border border-input bg-card p-3 text-sm focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15"
                />
                <Button
                  onClick={() => resolveMutation.mutate(resolution.trim())}
                  disabled={resolution.trim().length < 3 || resolveMutation.isPending}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {resolveMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  Hal qilingan deb belgilash
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function TimelineStep({
  done,
  label,
  date,
  icon: Icon,
}: {
  done: boolean;
  label: string;
  date?: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <li className="flex items-center gap-3">
      <div
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-full",
          done ? "bg-green-500 text-white" : "border-2 border-muted bg-card text-muted-foreground",
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1">
        <p className={cn("text-sm font-medium", done ? "text-foreground" : "text-muted-foreground")}>
          {label}
        </p>
        {date && <p className="text-xs text-muted-foreground">{date}</p>}
      </div>
    </li>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2.5 rounded-lg border bg-background px-3 py-2">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div>
        <p className="text-[11px] text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}
