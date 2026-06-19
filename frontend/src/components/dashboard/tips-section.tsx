import { CheckCircle2, FileText, ShieldCheck, Sparkles } from "lucide-react";

const TIPS = [
  {
    icon: FileText,
    text: "Ijara shartnomasini diqqat bilan o'qib chiqing — bandlar, muddat va to'lov tartibi.",
  },
  {
    icon: ShieldCheck,
    text: "Faqat HEMIS orqali tasdiqlangan ijara beruvchilar bilan ishlang.",
  },
  {
    icon: Sparkles,
    text: "Bron qilganingizdan keyin 24 soat ichida pulingizni qaytarib olishingiz mumkin.",
  },
];

export function TipsSection() {
  return (
    <section className="overflow-hidden rounded-2xl border bg-gradient-to-br from-blue-50 via-white to-yellow-50 p-6 sm:p-8">
      <div className="grid items-center gap-6 sm:grid-cols-[1fr_auto]">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-blue-700">
            <Sparkles className="h-3.5 w-3.5" />
            Foydali maslahatlar
          </span>
          <h2 className="mt-3 text-xl font-bold tracking-tight md:text-2xl">
            Xavfsiz ijara uchun
          </h2>
          <ul className="mt-4 space-y-3">
            {TIPS.map((t, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm">
                  <t.icon className="h-4 w-4 text-blue-600" />
                </span>
                <span className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                  <span>{t.text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Decorative illustration (CSS-only) */}
        <div className="relative hidden h-44 w-44 sm:block">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-400 to-blue-700 opacity-90" />
          <div className="absolute inset-2 rounded-full bg-gradient-to-br from-blue-100 to-white" />
          <div className="absolute inset-6 rounded-full bg-gradient-to-br from-blue-500 to-blue-700" />
          <ShieldCheck className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 text-white" />
          <div className="absolute -right-2 top-2 h-8 w-8 rounded-full bg-yellow-400 shadow-lg animate-float-slow" />
          <div className="absolute -left-2 bottom-2 h-6 w-6 rounded-full bg-red-400 shadow-md animate-float-medium" />
        </div>
      </div>
    </section>
  );
}
