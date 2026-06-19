"use client";

import { Sparkles } from "lucide-react";

import { AdminDashboard } from "@/components/dashboard/admin-dashboard";
import { CuratorDashboard } from "@/components/dashboard/curator-dashboard";
import { LandlordDashboard } from "@/components/dashboard/landlord-dashboard";
import { RecommendedHouses } from "@/components/dashboard/recommended-houses";
import { RefundCard } from "@/components/dashboard/refund-card";
import { StatusCards } from "@/components/dashboard/status-cards";
import { TipsSection } from "@/components/dashboard/tips-section";
import { WelcomeCard } from "@/components/dashboard/welcome-card";
import { useBookings } from "@/lib/api/hooks";
import type { UserResponse } from "@/lib/api/types";
import { useAuthStore } from "@/stores/auth";

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  if (!user) return null;

  if (user.role === "student") return <StudentDashboard user={user} />;
  if (user.role === "landlord") return <LandlordDashboard user={user} />;
  if (user.role === "admin") return <AdminDashboard user={user} />;
  if (user.role === "curator") return <CuratorDashboard user={user} />;

  return (
    <div className="rounded-2xl border bg-card p-12 text-center">
      <Sparkles className="mx-auto h-10 w-10 text-primary" />
      <h2 className="mt-4 text-xl font-bold">Bu rol uchun panel tez orada</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Ushbu rol uchun panel ishlab chiqilmoqda.
      </p>
    </div>
  );
}

function StudentDashboard({ user }: { user: UserResponse }) {
  const { data: bookings } = useBookings();
  const items = bookings?.items ?? [];
  const latest = [...items].sort((a, b) => b.created_at.localeCompare(a.created_at))[0];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <WelcomeCard user={user} />
      <StatusCards latestBooking={latest} savedCount={0} />
      <RefundCard />
      <RecommendedHouses />
      <TipsSection />
    </div>
  );
}
