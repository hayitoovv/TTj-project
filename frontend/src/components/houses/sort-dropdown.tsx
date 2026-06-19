"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { HouseFilter } from "@/lib/api/types";

type Sort = NonNullable<HouseFilter["sort"]>;

const OPTIONS: { value: Sort; label: string }[] = [
  { value: "created_desc", label: "Eng yangi" },
  { value: "price_asc", label: "Narx: arzondan qimmatga" },
  { value: "price_desc", label: "Narx: qimmatdan arzonga" },
  { value: "rating_desc", label: "Reyting bo'yicha" },
  { value: "views_desc", label: "Eng ko'p ko'rilgan" },
];

export function SortDropdown({
  value,
  onChange,
}: {
  value: Sort | undefined;
  onChange: (s: Sort) => void;
}) {
  return (
    <Select value={value ?? "created_desc"} onValueChange={(v) => onChange(v as Sort)}>
      <SelectTrigger className="w-[220px]">
        <SelectValue placeholder="Tartiblash" />
      </SelectTrigger>
      <SelectContent>
        {OPTIONS.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
