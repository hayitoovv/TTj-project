import { cn } from "@/lib/utils";
import type { BookingStatus } from "@/lib/api/types";

const MAP: Record<BookingStatus, { label: string; className: string }> = {
  pending: {
    label: "Kutilmoqda",
    className: "bg-yellow-100 text-yellow-800 border-yellow-200",
  },
  confirmed: {
    label: "Tasdiqlangan",
    className: "bg-blue-100 text-blue-800 border-blue-200",
  },
  active: {
    label: "Faol",
    className: "bg-green-100 text-green-800 border-green-200",
  },
  ended: {
    label: "Tugagan",
    className: "bg-gray-100 text-gray-700 border-gray-200",
  },
  cancelled: {
    label: "Bekor qilindi",
    className: "bg-red-100 text-red-800 border-red-200",
  },
  refunded: {
    label: "Refund qilindi",
    className: "bg-orange-100 text-orange-800 border-orange-200",
  },
};

export function StatusBadge({ status }: { status: BookingStatus }) {
  const { label, className } = MAP[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        className,
      )}
    >
      {label}
    </span>
  );
}
