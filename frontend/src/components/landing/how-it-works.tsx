import { CreditCard, Search, ShieldCheck, UserCheck } from "lucide-react";

const steps = [
  {
    icon: UserCheck,
    title: "Ro'yxatdan o'ting",
    description: "Telefon yoki HEMIS orqali 1 daqiqada.",
    color: "bg-blue-100 text-blue-600",
  },
  {
    icon: Search,
    title: "Uy toping",
    description: "Filterlar va xarita orqali eng mosini.",
    color: "bg-yellow-100 text-yellow-700",
  },
  {
    icon: CreditCard,
    title: "Bron + to'lov",
    description: "Click/Payme bilan xavfsiz to'lang.",
    color: "bg-green-100 text-green-600",
  },
  {
    icon: ShieldCheck,
    title: "Joylashing",
    description: "Avtomatik shartnoma va kafolat bilan.",
    color: "bg-red-100 text-red-600",
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="border-y bg-muted/30 py-24">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-primary">
            Qanday ishlaydi
          </span>
          <h2 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
            <span className="text-gradient-brand">4 ta qadam</span> — uyga ko&apos;chasiz
          </h2>
        </div>

        <div className="relative mt-14">
          {/* connector line (desktop only) */}
          <div className="absolute top-8 left-[10%] right-[10%] hidden h-0.5 bg-gradient-to-r from-blue-400 via-yellow-400 to-red-400 md:block" />

          <div className="grid gap-8 md:grid-cols-4">
            {steps.map((s, i) => (
              <div key={s.title} className="relative text-center">
                <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-full border-4 border-background bg-card shadow-lg">
                  <div className={`flex h-full w-full items-center justify-center rounded-full ${s.color}`}>
                    <s.icon className="h-7 w-7" />
                  </div>
                  <span className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full bg-foreground text-xs font-bold text-background">
                    {i + 1}
                  </span>
                </div>
                <h3 className="mt-5 text-lg font-semibold">{s.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
