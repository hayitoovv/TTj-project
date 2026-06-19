import { Building2, GraduationCap, Star, Users } from "lucide-react";

const stats = [
  { icon: Users, value: "5 000+", label: "Faol talaba", color: "text-blue-600" },
  { icon: Building2, value: "1 500+", label: "Tasdiqlangan uy", color: "text-yellow-600" },
  { icon: GraduationCap, value: "50+", label: "Universitet", color: "text-red-600" },
  { icon: Star, value: "4.9 / 5", label: "O'rtacha reyting", color: "text-green-600" },
];

export function Stats() {
  return (
    <section className="container mx-auto max-w-6xl px-4 py-16">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="group relative overflow-hidden rounded-2xl border bg-card p-6 transition hover:shadow-lg"
          >
            <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br from-blue-100 to-yellow-100 opacity-0 blur-2xl transition-opacity group-hover:opacity-100" />
            <s.icon className={`h-7 w-7 ${s.color}`} />
            <div className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">{s.value}</div>
            <div className="mt-1 text-sm text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
