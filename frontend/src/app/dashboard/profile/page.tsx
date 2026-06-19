"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  Calendar,
  Crown,
  Edit,
  GraduationCap,
  ImagePlus,
  Loader2,
  Mail,
  Phone,
  Save,
  ShieldCheck,
  Trash2,
  User as UserIcon,
  X,
} from "lucide-react";
import { useRef, useState } from "react";

import { ProBadge } from "@/components/dashboard/pro-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authApi, type UserUpdateInput, type StudentProfileUpdateInput, type LandlordProfileUpdateInput, type CuratorProfileUpdateInput } from "@/lib/api/auth";
import { extractApiError } from "@/lib/api/client";
import { useSubscriptionStatus } from "@/lib/api/hooks";
import type { UserResponse } from "@/lib/api/types";
import { fullUploadUrl, uploadsApi } from "@/lib/api/uploads";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth";

const ROLE_LABELS: Record<string, string> = {
  student: "Talaba",
  landlord: "Uy egasi",
  curator: "Kurator",
  admin: "Admin",
};

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const { data: subscriptionStatus } = useSubscriptionStatus();
  const isPro = Boolean(subscriptionStatus?.is_pro);

  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Basic fields
  const [firstName, setFirstName] = useState(user?.first_name ?? "");
  const [lastName, setLastName] = useState(user?.last_name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url ?? "");

  // Role-specific
  const [studentFields, setStudentFields] = useState({
    faculty: user?.student_profile?.faculty ?? "",
    course: user?.student_profile?.course?.toString() ?? "",
    group_name: user?.student_profile?.group_name ?? "",
  });
  const [landlordFields, setLandlordFields] = useState({
    passport_series: user?.landlord_profile?.passport_series ?? "",
    passport_number: user?.landlord_profile?.passport_number ?? "",
  });
  const [curatorFields, setCuratorFields] = useState({
    position: user?.curator_profile?.position ?? "",
  });

  if (!user) return null;

  const initial =
    (user.first_name?.[0] ?? user.last_name?.[0] ?? "U").toString().toUpperCase();
  const fullName = `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim() || "Ismi yo'q";

  const mutation = useMutation({
    mutationFn: async () => {
      // Update basic info if changed
      const basicChanges: UserUpdateInput = {};
      if (firstName !== (user.first_name ?? "")) basicChanges.first_name = firstName;
      if (lastName !== (user.last_name ?? "")) basicChanges.last_name = lastName;
      if (email !== (user.email ?? "")) basicChanges.email = email || undefined;
      if (avatarUrl !== (user.avatar_url ?? "")) basicChanges.avatar_url = avatarUrl || undefined;

      let updated: UserResponse = user;
      if (Object.keys(basicChanges).length > 0) {
        updated = await authApi.updateMe(basicChanges);
      }

      // Update role profile
      if (user.role === "student") {
        const sp: StudentProfileUpdateInput = {};
        if (studentFields.faculty !== (user.student_profile?.faculty ?? "")) {
          sp.faculty = studentFields.faculty;
        }
        if (studentFields.course !== (user.student_profile?.course?.toString() ?? "")) {
          sp.course = studentFields.course ? Number(studentFields.course) : undefined;
        }
        if (studentFields.group_name !== (user.student_profile?.group_name ?? "")) {
          sp.group_name = studentFields.group_name;
        }
        if (Object.keys(sp).length > 0) {
          updated = await authApi.updateStudentProfile(sp);
        }
      } else if (user.role === "landlord") {
        const lp: LandlordProfileUpdateInput = {};
        if (landlordFields.passport_series !== (user.landlord_profile?.passport_series ?? "")) {
          lp.passport_series = landlordFields.passport_series;
        }
        if (landlordFields.passport_number !== (user.landlord_profile?.passport_number ?? "")) {
          lp.passport_number = landlordFields.passport_number;
        }
        if (Object.keys(lp).length > 0) {
          updated = await authApi.updateLandlordProfile(lp);
        }
      } else if (user.role === "curator") {
        const cp: CuratorProfileUpdateInput = {};
        if (curatorFields.position !== (user.curator_profile?.position ?? "")) {
          cp.position = curatorFields.position;
        }
        if (Object.keys(cp).length > 0) {
          updated = await authApi.updateCuratorProfile(cp);
        }
      }
      return updated;
    },
    onSuccess: (updated) => {
      setUser(updated);
      queryClient.invalidateQueries({ queryKey: ["auth"] });
      setEditing(false);
      setError(null);
    },
    onError: (e) => setError(extractApiError(e)),
  });

  const cancelEdit = () => {
    setFirstName(user.first_name ?? "");
    setLastName(user.last_name ?? "");
    setEmail(user.email ?? "");
    setAvatarUrl(user.avatar_url ?? "");
    setStudentFields({
      faculty: user.student_profile?.faculty ?? "",
      course: user.student_profile?.course?.toString() ?? "",
      group_name: user.student_profile?.group_name ?? "",
    });
    setLandlordFields({
      passport_series: user.landlord_profile?.passport_series ?? "",
      passport_number: user.landlord_profile?.passport_number ?? "",
    });
    setCuratorFields({
      position: user.curator_profile?.position ?? "",
    });
    setEditing(false);
    setError(null);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header card */}
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl border bg-card p-6 sm:p-8",
          isPro && "border-yellow-300 ring-1 ring-yellow-300/30",
        )}
      >
        <div
          className={cn(
            "pointer-events-none absolute inset-x-0 top-0 h-32",
            isPro
              ? "bg-gradient-to-r from-yellow-400 via-orange-400 to-orange-500"
              : "bg-gradient-brand",
          )}
        />
        <div className="relative flex flex-wrap items-end gap-5 pt-12 sm:pt-16">
          <div className="relative">
            <div
              className={cn(
                "flex h-24 w-24 items-center justify-center rounded-full border-4 border-background bg-gradient-to-br from-blue-500 to-yellow-400 text-2xl font-extrabold text-white",
                isPro && "ring-2 ring-yellow-400",
              )}
            >
              {user.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={fullUploadUrl(user.avatar_url) ?? user.avatar_url}
                  alt=""
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                initial
              )}
            </div>
            {isPro && (
              <span
                aria-label="PRO"
                className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 shadow-md ring-4 ring-background"
              >
                <Crown className="h-4 w-4 text-foreground" />
              </span>
            )}
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-extrabold tracking-tight">{fullName}</h1>
              {isPro && <ProBadge size="md" />}
              {user.is_verified && (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                  <ShieldCheck className="h-3 w-3" /> Tasdiqlangan
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {ROLE_LABELS[user.role]} · A&apos;zo bo&apos;lgan{" "}
              {new Date(user.created_at).toLocaleDateString("uz-UZ", {
                year: "numeric",
                month: "long",
              })}
              {isPro && subscriptionStatus?.ends_at && (
                <>
                  {" · "}
                  <span className="font-medium text-orange-700">
                    PRO {subscriptionStatus.days_remaining} kun qoldi
                  </span>
                </>
              )}
            </p>
          </div>
          {!editing ? (
            <Button onClick={() => setEditing(true)} className="shadow-md">
              <Edit className="h-4 w-4" />
              Tahrirlash
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" onClick={cancelEdit} disabled={mutation.isPending}>
                <X className="h-4 w-4" />
                Bekor
              </Button>
              <Button onClick={() => mutation.mutate()} disabled={mutation.isPending} className="shadow-md">
                {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Saqlash
              </Button>
            </div>
          )}
        </div>
      </div>

      {error && (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      {/* Personal */}
      <Section title="Shaxsiy ma'lumotlar">
        <Grid>
          <Field label="Ism">
            {editing ? (
              <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Ism" />
            ) : (
              <DisplayValue value={user.first_name} />
            )}
          </Field>
          <Field label="Familiya">
            {editing ? (
              <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Familiya" />
            ) : (
              <DisplayValue value={user.last_name} />
            )}
          </Field>
        </Grid>

        <Grid>
          <Field label="Telefon" icon={Phone}>
            <DisplayValue value={user.phone} muted />
            <p className="text-[11px] text-muted-foreground">Telefon raqamini o&apos;zgartirib bo&apos;lmaydi</p>
          </Field>
          <Field label="Email" icon={Mail}>
            {editing ? (
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="example@mail.com" />
            ) : (
              <DisplayValue value={user.email} />
            )}
          </Field>
        </Grid>

        {editing && (
          <Field label="Profil rasmi">
            <AvatarUploader
              value={avatarUrl}
              onChange={setAvatarUrl}
              initial={initial}
            />
          </Field>
        )}
      </Section>

      {/* Role-specific */}
      {user.role === "student" && (
        <Section title="Talaba ma'lumotlari">
          <Field label="HEMIS ID" icon={GraduationCap}>
            <DisplayValue value={user.student_profile?.hemis_id} muted />
            <p className="text-[11px] text-muted-foreground">HEMIS ID o&apos;zgartirib bo&apos;lmaydi</p>
          </Field>
          <Field label="Universitet" icon={Building2}>
            <DisplayValue value={user.student_profile?.university_id ? `#${user.student_profile.university_id}` : null} muted />
          </Field>
          <Grid>
            <Field label="Fakultet">
              {editing ? (
                <Input value={studentFields.faculty} onChange={(e) => setStudentFields((f) => ({ ...f, faculty: e.target.value }))} />
              ) : (
                <DisplayValue value={user.student_profile?.faculty} />
              )}
            </Field>
            <Field label="Kurs">
              {editing ? (
                <Input type="number" min={1} max={6} value={studentFields.course} onChange={(e) => setStudentFields((f) => ({ ...f, course: e.target.value }))} />
              ) : (
                <DisplayValue value={user.student_profile?.course ? `${user.student_profile.course}-kurs` : null} />
              )}
            </Field>
          </Grid>
          <Field label="Guruh">
            {editing ? (
              <Input value={studentFields.group_name} onChange={(e) => setStudentFields((f) => ({ ...f, group_name: e.target.value }))} placeholder="113-23" />
            ) : (
              <DisplayValue value={user.student_profile?.group_name} />
            )}
          </Field>
        </Section>
      )}

      {user.role === "landlord" && (
        <Section title="Uy egasi ma'lumotlari">
          <Grid>
            <Field label="Passport seriya">
              {editing ? (
                <Input value={landlordFields.passport_series} onChange={(e) => setLandlordFields((f) => ({ ...f, passport_series: e.target.value }))} placeholder="AA" />
              ) : (
                <DisplayValue value={user.landlord_profile?.passport_series} />
              )}
            </Field>
            <Field label="Passport raqami">
              {editing ? (
                <Input value={landlordFields.passport_number} onChange={(e) => setLandlordFields((f) => ({ ...f, passport_number: e.target.value }))} placeholder="1234567" />
              ) : (
                <DisplayValue value={user.landlord_profile?.passport_number} />
              )}
            </Field>
          </Grid>
          <Field label="PRO obuna">
            <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold", user.landlord_profile?.is_pro ? "bg-yellow-100 text-yellow-800" : "bg-muted text-muted-foreground")}>
              {user.landlord_profile?.is_pro ? "Faol ⭐" : "Yo'q"}
            </span>
          </Field>
        </Section>
      )}

      {user.role === "curator" && (
        <Section title="Kurator ma'lumotlari">
          <Field label="Lavozim">
            {editing ? (
              <Input value={curatorFields.position} onChange={(e) => setCuratorFields((f) => ({ ...f, position: e.target.value }))} placeholder="Masalan: Talabalar nazorati" />
            ) : (
              <DisplayValue value={user.curator_profile?.position} />
            )}
          </Field>
        </Section>
      )}

      <Section title="Akkaunt holati">
        <Field label="Holat" icon={ShieldCheck}>
          <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold", user.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>
            {user.is_active ? "Faol" : "Bloklangan"}
          </span>
        </Field>
        <Field label="Ro'yxatdan o'tilgan sana" icon={Calendar}>
          <DisplayValue
            value={new Date(user.created_at).toLocaleDateString("uz-UZ", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
            muted
          />
        </Field>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border bg-card p-6">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h2>
      <div className="mt-4 space-y-4">{children}</div>
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2">{children}</div>;
}

function Field({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        {Icon && <Icon className="h-3.5 w-3.5" />}
        {label}
      </Label>
      <div>{children}</div>
    </div>
  );
}

function DisplayValue({ value, muted = false }: { value: string | null | undefined; muted?: boolean }) {
  if (!value) {
    return <p className="text-sm text-muted-foreground/60 italic">—</p>;
  }
  return <p className={cn("text-sm font-medium", muted && "text-muted-foreground")}>{value}</p>;
}

function AvatarUploader({
  value,
  onChange,
  initial,
}: {
  value: string;
  onChange: (url: string) => void;
  initial: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const result = await uploadsApi.uploadImage(file, "avatars");
      onChange(result.url);
    } catch (e) {
      setError(extractApiError(e));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const previewSrc = value ? (fullUploadUrl(value) ?? value) : null;

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => !uploading && inputRef.current?.click()}
          disabled={uploading}
          className={cn(
            "group relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-input bg-muted/30 text-xl font-extrabold text-muted-foreground transition",
            !uploading && "hover:border-primary hover:text-primary",
            uploading && "opacity-60",
          )}
          aria-label="Rasm yuklash"
        >
          {previewSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewSrc} alt="" className="h-full w-full object-cover" />
          ) : (
            <span>{initial}</span>
          )}
          {uploading ? (
            <span className="absolute inset-0 flex items-center justify-center bg-foreground/40 text-white">
              <Loader2 className="h-6 w-6 animate-spin" />
            </span>
          ) : (
            <span className="absolute inset-0 flex items-center justify-center bg-foreground/40 text-white opacity-0 transition-opacity group-hover:opacity-100">
              <ImagePlus className="h-6 w-6" />
            </span>
          )}
        </button>

        <div className="space-y-1.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
          >
            <ImagePlus className="h-4 w-4" />
            {value ? "O'zgartirish" : "Rasm tanlash"}
          </Button>
          {value && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onChange("")}
              disabled={uploading}
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              O&apos;chirish
            </Button>
          )}
          <p className="text-[11px] text-muted-foreground">JPG/PNG/WebP — max 10 MB</p>
        </div>
      </div>

      {error && (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
