"use client";

import { Building2, GraduationCap, Star, Users } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface StatItem {
  icon: typeof Users;
  target: number;
  display: (n: number) => string;
  label: string;
  color: string;
  iconBg: string;
}

const stats: StatItem[] = [
  {
    icon: Users,
    target: 5000,
    display: (n) => `${n.toLocaleString("ru-RU")}+`,
    label: "Faol talaba",
    color: "text-blue-600",
    iconBg: "from-blue-100 to-blue-200",
  },
  {
    icon: Building2,
    target: 1500,
    display: (n) => `${n.toLocaleString("ru-RU")}+`,
    label: "Tasdiqlangan uy",
    color: "text-yellow-700",
    iconBg: "from-yellow-100 to-orange-200",
  },
  {
    icon: GraduationCap,
    target: 50,
    display: (n) => `${n}+`,
    label: "Universitet",
    color: "text-red-600",
    iconBg: "from-red-100 to-pink-200",
  },
  {
    icon: Star,
    target: 49,
    display: (n) => `${(n / 10).toFixed(1)} / 5`,
    label: "O'rtacha reyting",
    color: "text-green-600",
    iconBg: "from-green-100 to-emerald-200",
  },
];

function useCountUp(target: number, duration = 1600, start = false) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start) return;
    let raf = 0;
    const t0 = performance.now();
    const step = (t: number) => {
      const p = Math.min(1, (t - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(eased * target));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, start]);
  return value;
}

function StatCard({ stat, visible }: { stat: StatItem; visible: boolean }) {
  const v = useCountUp(stat.target, 1600, visible);
  const Icon = stat.icon;
  return (
    <div className="group relative overflow-hidden rounded-2xl border bg-card p-6 transition hover:-translate-y-1 hover:shadow-lg">
      <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gradient-to-br from-blue-100 to-yellow-100 opacity-0 blur-2xl transition-opacity group-hover:opacity-100" />
      <div
        className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${stat.iconBg}`}
      >
        <Icon className={`h-6 w-6 ${stat.color}`} />
      </div>
      <div className="mt-4 text-3xl font-extrabold tracking-tight tabular-nums md:text-4xl">
        {stat.display(v)}
      </div>
      <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
    </div>
  );
}

export function Stats() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section className="container mx-auto max-w-6xl px-4 py-16">
      <div ref={ref} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <StatCard key={s.label} stat={s} visible={visible} />
        ))}
      </div>
    </section>
  );
}
