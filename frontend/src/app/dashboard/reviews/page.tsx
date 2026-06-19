"use client";

import { Home, Star, User } from "lucide-react";

import { ReviewList } from "@/components/reviews/review-list";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useReviews } from "@/lib/api/hooks";
import { useAuthStore } from "@/stores/auth";

export default function ReviewsPage() {
  const user = useAuthStore((s) => s.user);
  if (!user) return null;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">
          Sharhlar va <span className="text-gradient-brand">reyting</span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {user.role === "landlord"
            ? "Talabalardan kelgan sharhlar va sizning sharhlaringiz"
            : "Sizning sharhlaringiz va siz haqingizdagi fikrlar"}
        </p>
      </div>

      <Stats userId={user.id} />

      <Tabs defaultValue="received">
        <TabsList>
          <TabsTrigger value="received">
            <span className="inline-flex items-center gap-1.5">
              <User className="h-4 w-4" />
              {user.role === "landlord" ? "Mendan haqida" : "Men haqimda"}
            </span>
          </TabsTrigger>
          <TabsTrigger value="written">
            <span className="inline-flex items-center gap-1.5">
              <Star className="h-4 w-4" />
              Mening sharhlarim
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="received">
          <ReviewList
            filter={{ target_user_id: user.id, page_size: 20 }}
            emptyText="Siz haqingizda hali sharhlar yo'q."
          />
        </TabsContent>

        <TabsContent value="written">
          <ReviewList
            filter={{ reviewer_id: user.id, page_size: 20 }}
            emptyText="Siz hali sharh yozmadingiz."
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Stats({ userId }: { userId: number }) {
  const { data: about } = useReviews({ target_user_id: userId, page_size: 100 });
  const { data: written } = useReviews({ reviewer_id: userId, page_size: 100 });

  const aboutCount = about?.total ?? 0;
  const writtenCount = written?.total ?? 0;
  const avgRating =
    about && about.items.length
      ? about.items.reduce((sum, r) => sum + r.rating, 0) / about.items.length
      : 0;

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Card icon={Star} label="O'rtacha bahom" value={avgRating > 0 ? avgRating.toFixed(1) : "—"} />
      <Card icon={User} label="Men haqimda" value={String(aboutCount)} />
      <Card icon={Home} label="Yozganlarim" value={String(writtenCount)} />
    </div>
  );
}

function Card({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border bg-card p-5">
      <Icon className="h-5 w-5 text-yellow-500" />
      <p className="mt-3 text-3xl font-extrabold tracking-tight">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
