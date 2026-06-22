"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  Edit,
  GraduationCap,
  Hash,
  Loader2,
  MapPin,
  Plus,
  Search,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { extractApiError } from "@/lib/api/client";
import { useUniversities } from "@/lib/api/hooks";
import {
  type UniversityCreate,
  type UniversityRead,
  type UniversityUpdate,
  universitiesApi,
} from "@/lib/api/universities";
import { cn } from "@/lib/utils";

export default function UniversitiesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<UniversityRead | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const { data, isLoading } = useUniversities({
    q: search.trim() || undefined,
    page_size: 100,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => universitiesApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["universities"] }),
    onError: (e) => alert(extractApiError(e)),
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">
            Universitetlar <span className="text-gradient-brand">boshqaruvi</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {data ? `Jami ${data.total} ta universitet` : "Yuklanmoqda..."}
          </p>
        </div>
        <Button onClick={() => setIsCreating(true)} className="shadow-md">
          <Plus className="h-4 w-4" />
          Yangi universitet
        </Button>
      </header>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Nom, qisqartma yoki HEMIS kod..."
          className="h-11 pl-10"
        />
      </div>

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl bg-muted/40" />
          ))}
        </div>
      ) : data?.items.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-muted/20 p-12 text-center">
          <GraduationCap className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <h3 className="mt-4 text-lg font-semibold">Universitetlar topilmadi</h3>
          <Button onClick={() => setIsCreating(true)} className="mt-4">
            <Plus className="h-4 w-4" />
            Birinchisini qo&apos;shing
          </Button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {data?.items.map((uni) => (
            <UniversityCard
              key={uni.id}
              university={uni}
              onEdit={() => setEditing(uni)}
              onDelete={() => {
                if (
                  confirm(
                    `«${uni.short_name || uni.name}» universitetini o'chirish? Bu amalni bekor qilib bo'lmaydi.`,
                  )
                ) {
                  deleteMutation.mutate(uni.id);
                }
              }}
              isDeleting={deleteMutation.isPending}
            />
          ))}
        </div>
      )}

      {(isCreating || editing) && (
        <UniversityForm
          university={editing}
          onClose={() => {
            setIsCreating(false);
            setEditing(null);
          }}
          onSaved={() => {
            queryClient.invalidateQueries({ queryKey: ["universities"] });
            setIsCreating(false);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function UniversityCard({
  university,
  onEdit,
  onDelete,
  isDeleting,
}: {
  university: UniversityRead;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}) {
  return (
    <article className="rounded-2xl border bg-card p-5 transition hover:shadow-md">
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-yellow-400 text-white shadow-sm">
          <Building2 className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-bold">{university.name}</h3>
          {university.short_name && (
            <p className="mt-0.5 text-xs text-muted-foreground">{university.short_name}</p>
          )}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
        {university.region && (
          <span className="inline-flex items-center gap-1 text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {university.region}
          </span>
        )}
        {university.hemis_code && (
          <span className="inline-flex items-center gap-1 text-muted-foreground">
            <Hash className="h-3 w-3" />
            HEMIS: {university.hemis_code}
          </span>
        )}
        <span className="inline-flex items-center gap-1 font-semibold text-foreground">
          <Users className="h-3 w-3" />
          {university.student_count} talaba
        </span>
      </div>

      <div className="mt-4 flex gap-2">
        <Button size="sm" variant="outline" onClick={onEdit} className="flex-1">
          <Edit className="h-3.5 w-3.5" />
          Tahrirlash
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onDelete}
          disabled={isDeleting || university.student_count > 0}
          className={cn(
            "px-3",
            university.student_count === 0
              ? "text-destructive hover:bg-destructive/10 hover:text-destructive"
              : "opacity-50",
          )}
          title={
            university.student_count > 0
              ? "Bu universitetda talabalar bor"
              : "O'chirish"
          }
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </article>
  );
}

function UniversityForm({
  university,
  onClose,
  onSaved,
}: {
  university: UniversityRead | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!university;
  const [form, setForm] = useState<UniversityCreate>({
    name: university?.name ?? "",
    short_name: university?.short_name ?? "",
    hemis_code: university?.hemis_code ?? "",
    region: university?.region ?? "",
    address: university?.address ?? "",
  });
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      const payload: UniversityCreate | UniversityUpdate = {
        name: form.name.trim(),
        short_name: form.short_name?.trim() || undefined,
        hemis_code: form.hemis_code?.trim() || undefined,
        region: form.region?.trim() || undefined,
        address: form.address?.trim() || undefined,
      };
      if (isEdit && university) {
        return universitiesApi.update(university.id, payload);
      }
      return universitiesApi.create(payload as UniversityCreate);
    },
    onSuccess: () => onSaved(),
    onError: (e) => setError(extractApiError(e)),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border bg-background shadow-xl">
        <div className="flex items-start justify-between border-b p-5">
          <div>
            <h3 className="text-lg font-bold">
              {isEdit ? "Universitetni tahrirlash" : "Yangi universitet"}
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              HEMIS integratsiyasi uchun ma&apos;lumotlarni to&apos;ldiring
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 transition hover:bg-muted"
            aria-label="Yopish"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            if (form.name.trim().length < 2) {
              setError("Universitet nomi kerak");
              return;
            }
            mutation.mutate();
          }}
          className="space-y-4 p-5"
        >
          <div>
            <Label>To&apos;liq nomi *</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Toshkent davlat universiteti"
              required
              className="mt-1"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Qisqartma</Label>
              <Input
                value={form.short_name ?? ""}
                onChange={(e) => setForm({ ...form, short_name: e.target.value })}
                placeholder="TDU"
                className="mt-1"
              />
            </div>
            <div>
              <Label>HEMIS kodi</Label>
              <Input
                value={form.hemis_code ?? ""}
                onChange={(e) => setForm({ ...form, hemis_code: e.target.value })}
                placeholder="123456"
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label>Hudud</Label>
            <Input
              value={form.region ?? ""}
              onChange={(e) => setForm({ ...form, region: e.target.value })}
              placeholder="Toshkent"
              className="mt-1"
            />
          </div>

          <div>
            <Label>Manzil</Label>
            <Input
              value={form.address ?? ""}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="Universitet ko'chasi, 4"
              className="mt-1"
            />
          </div>

          {error && (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </p>
          )}

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Bekor
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={mutation.isPending || form.name.trim().length < 2}
            >
              {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEdit ? "Saqlash" : "Yaratish"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
