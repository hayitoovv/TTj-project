"use client";

import { GraduationCap, Home, ShieldCheck } from "lucide-react";

import { cn } from "@/lib/utils";
import type { UserRole } from "@/lib/api/types";

type Role = Exclude<UserRole, "admin">;

const OPTIONS: { value: Role; label: string; description: string; icon: typeof Home }[] = [
  {
    value: "student",
    label: "Talaba",
    description: "Uy izlayman",
    icon: GraduationCap,
  },
  {
    value: "landlord",
    label: "Uy egasi",
    description: "Ijaraga beraman",
    icon: Home,
  },
  {
    value: "curator",
    label: "Kurator",
    description: "Talabalarni nazorat",
    icon: ShieldCheck,
  },
];

export function RolePicker({
  value,
  onChange,
}: {
  value: Role;
  onChange: (r: Role) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {OPTIONS.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={cn(
              "flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 text-center transition",
              active
                ? "border-primary bg-primary/5 shadow-sm"
                : "border-input hover:border-primary/30 hover:bg-muted/50",
            )}
          >
            <o.icon className={cn("h-5 w-5", active ? "text-primary" : "text-muted-foreground")} />
            <span className="text-sm font-semibold">{o.label}</span>
            <span className="text-[11px] text-muted-foreground">{o.description}</span>
          </button>
        );
      })}
    </div>
  );
}
