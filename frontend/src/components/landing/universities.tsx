import { GraduationCap, ShieldCheck } from "lucide-react";

const universities = [
  "TUIT",
  "TDU",
  "Inha",
  "Westminster",
  "TATU",
  "TSUE",
  "MIT World",
  "Yeoju",
  "TURIN",
  "TIIAME",
  "MDIS",
  "Amity",
];

export function Universities() {
  return (
    <section className="border-y bg-card/60 py-12">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
            <ShieldCheck className="h-3 w-3" /> HEMIS integratsiyasi
          </span>
          <p className="text-sm text-muted-foreground">
            O&apos;zbekiston bo&apos;ylab <strong className="text-foreground">50+ universitet</strong>{" "}
            talabalari foydalanmoqda
          </p>
        </div>

        <div className="mt-8 grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-6">
          {universities.map((u) => (
            <div
              key={u}
              className="group flex items-center justify-center gap-2 rounded-xl border bg-card px-4 py-3 transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <GraduationCap className="h-4 w-4 text-muted-foreground/60 transition group-hover:text-primary" />
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground transition group-hover:text-foreground">
                {u}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
