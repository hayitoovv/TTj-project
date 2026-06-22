"use client";

import {
  Ban,
  Building2,
  Calendar,
  ChevronRight,
  GraduationCap,
  Phone,
  Search,
  ShieldAlert,
  ShieldCheck,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCuratorStudents } from "@/lib/api/hooks";
import type { StudentListFilter, StudentListItem } from "@/lib/api/curator";
import { cn } from "@/lib/utils";

const COURSES = [1, 2, 3, 4, 5, 6];

export default function StudentsPage() {
  const [filter, setFilter] = useState<StudentListFilter>({ page: 1, page_size: 20 });
  const [searchInput, setSearchInput] = useState("");
  const { data, isLoading } = useCuratorStudents(filter);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilter((f) => ({ ...f, q: searchInput.trim() || undefined, page: 1 }));
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">
          Talabalar <span className="text-gradient-brand">ro&apos;yxati</span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {data ? `Jami ${data.total} ta talaba` : "Yuklanmoqda..."}
        </p>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <form onSubmit={onSearch} className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Ism, telefon, HEMIS ID yoki guruh bo'yicha qidirish..."
            className="h-11 pl-10"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Kurs:
          </span>
          <button
            type="button"
            onClick={() => setFilter((f) => ({ ...f, course: undefined, page: 1 }))}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition",
              filter.course === undefined
                ? "border-primary bg-primary text-primary-foreground"
                : "border-input hover:bg-muted",
            )}
          >
            Hammasi
          </button>
          {COURSES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setFilter((f) => ({ ...f, course: c, page: 1 }))}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition",
                filter.course === c
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-input hover:bg-muted",
              )}
            >
              {c}-kurs
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-36 animate-pulse rounded-2xl bg-muted/40" />
          ))}
        </div>
      ) : data?.items.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-muted/20 p-12 text-center">
          <Users className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <h3 className="mt-4 text-lg font-semibold">Talabalar topilmadi</h3>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {data?.items.map((s) => <StudentCard key={s.id} student={s} />)}
        </div>
      )}

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
            {filter.page} / {data.pages}
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
    </div>
  );
}

function StudentCard({ student }: { student: StudentListItem }) {
  const name =
    `${student.first_name ?? ""} ${student.last_name ?? ""}`.trim() || student.phone;

  return (
    <Link
      href={`/dashboard/students/${student.id}`}
      className="group block rounded-2xl border bg-card p-5 transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
    >
      <header className="flex items-start gap-3">
        <Avatar
          src={student.avatar_url}
          firstName={student.first_name}
          lastName={student.last_name}
          size="md"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate font-semibold">{name}</h3>
            {student.is_verified && (
              <ShieldCheck className="h-3.5 w-3.5 text-green-600" aria-label="Tasdiqlangan" />
            )}
            {student.is_blocked && (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-bold text-destructive">
                <Ban className="h-3 w-3" />
                Bloklangan
              </span>
            )}
          </div>
          <span className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Phone className="h-3 w-3" />
            {student.phone}
          </span>
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/40 transition group-hover:translate-x-0.5 group-hover:text-primary" />
      </header>

      {/* Academic info */}
      <div className="mt-4 grid gap-2 rounded-xl bg-muted/30 p-3 text-xs">
        {student.university_short ? (
          <Row icon={Building2} value={`${student.university_short}`} />
        ) : (
          <Row icon={Building2} value="Universitet ko'rsatilmagan" muted />
        )}
        <Row
          icon={GraduationCap}
          value={
            student.course
              ? `${student.course}-kurs${student.group_name ? ` · ${student.group_name}` : ""}`
              : "Kurs ko'rsatilmagan"
          }
          muted={!student.course}
        />
        {student.hemis_id && (
          <Row icon={GraduationCap} value={`HEMIS: ${student.hemis_id}`} muted />
        )}
      </div>

      {/* Stats */}
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <StatChip
          label="Faol"
          value={student.active_bookings_count}
          color="text-green-600"
        />
        <StatChip
          label="Jami bron"
          value={student.total_bookings_count}
          color="text-blue-600"
        />
        <StatChip
          label="Shikoyat"
          value={student.open_complaints_count}
          color={student.open_complaints_count > 0 ? "text-red-600" : "text-muted-foreground"}
          icon={student.open_complaints_count > 0 ? ShieldAlert : undefined}
        />
      </div>

      <p className="mt-3 flex items-center gap-1 text-[11px] text-muted-foreground/70">
        <Calendar className="h-3 w-3" />
        A&apos;zo: {new Date(student.created_at).toLocaleDateString("uz-UZ")}
      </p>
    </Link>
  );
}

function Row({
  icon: Icon,
  value,
  muted = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-2", muted && "text-muted-foreground")}>
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate">{value}</span>
    </div>
  );
}

function StatChip({
  label,
  value,
  color,
  icon: Icon,
}: {
  label: string;
  value: number;
  color: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-lg border bg-background px-2 py-1.5">
      <div className={cn("inline-flex items-center gap-1 text-lg font-extrabold", color)}>
        {Icon && <Icon className="h-3.5 w-3.5" />}
        {value}
      </div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
    </div>
  );
}
