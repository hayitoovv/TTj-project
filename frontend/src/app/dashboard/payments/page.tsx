"use client";

import { Sparkles } from "lucide-react";

import { useAuthStore } from "@/stores/auth";

import LandlordPayments from "./landlord";
import StudentPayments from "./student";

export default function PaymentsPage() {
  const user = useAuthStore((s) => s.user);
  if (!user) return null;

  if (user.role === "landlord") return <LandlordPayments />;
  if (user.role === "student") return <StudentPayments />;

  return (
    <div className="rounded-2xl border bg-card p-12 text-center">
      <Sparkles className="mx-auto h-10 w-10 text-primary" />
      <h2 className="mt-4 text-xl font-bold">Bu rol uchun to&apos;lovlar bo&apos;limi tez orada</h2>
    </div>
  );
}
