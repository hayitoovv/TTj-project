"use client";

import {
  ArrowRight,
  Clock,
  GraduationCap,
  MessageCircle,
  ShieldAlert,
  ShieldCheck,
  Users,
} from "lucide-react";
import Link from "next/link";

import { WelcomeCard } from "@/components/dashboard/welcome-card";
import { useAdminUsers, useComplaints } from "@/lib/api/hooks";
import type { UserResponse } from "@/lib/api/types";
import { cn } from "@/lib/utils";

export function CuratorDashboard({ user }: { user: UserResponse }) {
  const { data: newComplaints } = useComplaints({ status: "new", page_size: 5 });
  const { data: processingComplaints } = useComplaints({ status: "processing", page_size: 5 });
  const { data: resolvedComplaints } = useComplaints({ status: "resolved", page_size: 5 });
  // Note: curator role can't access admin users endpoint, but can see complaints reporters
  const { data: students } = useAdminUsers({ role: "student", page_size: 1 }, false);

  const newCount = newComplaints?.total ?? 0;
  const processingCount = processingComplaints?.total ?? 0;
  const resolvedCount = resolvedComplaints?.total ?? 0;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <WelcomeCard user={user} />

      {/* Urgent alert */}
      {newCount > 0 && (
        <Link
          href="/dashboard/complaints?status=new"
          className="block rounded-2xl border-2 border-red-300 bg-gradient-to-r from-red-50 to-orange-50 p-5 transition hover:shadow-md"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500 text-white shadow-md">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <p className="font-bold">{newCount} ta yangi shikoyat kutmoqda</p>
              <p className="text-sm text-muted-foreground">
                Talabalar va uy egalari kuratorga murojaat qilishgan
              </p>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
          </div>
        </Link>
      )}

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={ShieldAlert}
          label="Yangi shikoyatlar"
          value={newCount}
          sub="ko'rib chiqilmagan"
          color="from-red-500 to-rose-600"
        />
        <StatCard
          icon={Clock}
          label="Jarayonda"
          value={processingCount}
          sub="hozir ishlanmoqda"
          color="from-yellow-400 to-orange-500"
        />
        <StatCard
          icon={ShieldCheck}
          label="Hal qilingan"
          value={resolvedCount}
          sub="muvaffaqiyatli"
          color="from-green-500 to-emerald-600"
        />
        <StatCard
          icon={GraduationCap}
          label="Talabalar"
          value={students?.total ?? "—"}
          sub="biriktirilgan"
          color="from-blue-500 to-blue-700"
        />
      </div>

      {/* Two-column section */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* New complaints */}
        <ComplaintList
          title="Yangi shikoyatlar"
          href="/dashboard/complaints?status=new"
          complaints={newComplaints?.items ?? []}
          emptyText="Yangi shikoyatlar yo'q ✅"
          statusColor="bg-red-500"
        />
        {/* Processing */}
        <ComplaintList
          title="Jarayonda"
          href="/dashboard/complaints?status=processing"
          complaints={processingComplaints?.items ?? []}
          emptyText="Jarayondagi shikoyatlar yo'q"
          statusColor="bg-yellow-500"
        />
      </div>

      {/* Quick actions */}
      <div className="grid gap-3 sm:grid-cols-3">
        <ActionCard
          href="/dashboard/complaints"
          icon={ShieldAlert}
          title="Shikoyatlar"
          description="Barcha shikoyatlar"
        />
        <ActionCard
          href="/dashboard/students"
          icon={Users}
          title="Talabalar"
          description="Biriktirilgan talabalar"
        />
        <ActionCard
          href="/dashboard/messages"
          icon={MessageCircle}
          title="Xabarlar"
          description="Chat (tez orada)"
        />
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  sub: string;
  color: string;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border bg-card p-5 transition hover:shadow-md">
      <div
        className={cn(
          "inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm",
          color,
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-3 text-2xl font-extrabold tracking-tight md:text-3xl">{value}</p>
      <p className="mt-1 text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-[11px] text-muted-foreground/70">{sub}</p>
    </div>
  );
}

function ComplaintList({
  title,
  href,
  complaints,
  emptyText,
  statusColor,
}: {
  title: string;
  href: string;
  complaints: Array<{
    id: number;
    subject: string;
    description: string;
    reporter: { first_name?: string | null; last_name?: string | null; phone: string };
    created_at: string;
  }>;
  emptyText: string;
  statusColor: string;
}) {
  return (
    <section className="rounded-2xl border bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-bold">{title}</h2>
        {complaints.length > 0 && (
          <Link href={href} className="text-xs font-semibold text-primary hover:underline">
            Hammasi →
          </Link>
        )}
      </div>
      {complaints.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-muted/20 p-6 text-center text-sm text-muted-foreground">
          {emptyText}
        </div>
      ) : (
        <ul className="space-y-2">
          {complaints.slice(0, 4).map((c) => {
            const name =
              `${c.reporter.first_name ?? ""} ${c.reporter.last_name ?? ""}`.trim() ||
              c.reporter.phone;
            return (
              <li key={c.id}>
                <Link
                  href={`/dashboard/complaints/${c.id}`}
                  className="flex items-start gap-3 rounded-xl border bg-background p-3 transition hover:shadow-sm"
                >
                  <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", statusColor)} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{c.subject}</p>
                    <p className="truncate text-xs text-muted-foreground">{name}</p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function ActionCard({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border bg-card p-4 transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
    >
      <Icon className="h-5 w-5 text-primary" />
      <p className="mt-3 font-semibold">{title}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
    </Link>
  );
}
