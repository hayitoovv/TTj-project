import { Bookmark, ClipboardCheck, type LucideIcon } from "lucide-react";
import Link from "next/link";

import { StatusBadge } from "@/components/dashboard/status-badge";
import type { BookingListItem } from "@/lib/api/types";
import { fullUploadUrl } from "@/lib/api/uploads";
import { cn } from "@/lib/utils";

export function StatusCards({
  latestBooking,
  savedCount,
}: {
  latestBooking?: BookingListItem;
  savedCount: number;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {/* Application status */}
      <div className="rounded-2xl border bg-card p-5">
        <Header icon={ClipboardCheck} label="Mening so&apos;nggi bronim" accent="blue" />
        {latestBooking ? (
          <Link
            href={`/dashboard/bookings/${latestBooking.id}`}
            className="mt-4 block"
          >
            <div className="flex items-center gap-3">
              <div className="relative h-14 w-16 shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-blue-100 to-yellow-100">
                {latestBooking.house_photo && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={fullUploadUrl(latestBooking.house_photo) ?? latestBooking.house_photo}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">
                  {latestBooking.house_title ?? "Uy"}
                </p>
                <div className="mt-1">
                  <StatusBadge status={latestBooking.status} />
                </div>
              </div>
            </div>
          </Link>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">
            Hali bron qilmadingizmi?{" "}
            <Link href="/houses" className="font-semibold text-primary hover:underline">
              Uy izlash →
            </Link>
          </p>
        )}
      </div>

      {/* Saved houses */}
      <div className="rounded-2xl border bg-card p-5">
        <Header icon={Bookmark} label="Saqlangan uylar" accent="yellow" />
        <p className="mt-4 text-3xl font-extrabold tracking-tight">{savedCount}</p>
        <Link
          href="/dashboard/saved"
          className="mt-1 inline-block text-xs font-semibold text-primary hover:underline"
        >
          Ko&apos;rib chiqish →
        </Link>
      </div>
    </div>
  );
}

function Header({
  icon: Icon,
  label,
  accent,
}: {
  icon: LucideIcon;
  label: string;
  accent: "blue" | "yellow";
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-lg",
          accent === "blue" ? "bg-blue-100 text-blue-600" : "bg-yellow-100 text-yellow-700",
        )}
      >
        <Icon className="h-4.5 w-4.5" />
      </span>
      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </h3>
    </div>
  );
}
