import { Bed, MapPin, ShieldCheck, Star } from "lucide-react";

export function AuthShowcase() {
  return (
    <div className="relative hidden h-full overflow-hidden bg-gradient-brand p-10 text-white lg:flex lg:flex-col">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -left-20 h-96 w-96 rounded-full bg-white/15 blur-3xl animate-blob" />
        <div className="absolute bottom-0 right-0 h-[420px] w-[420px] rounded-full bg-yellow-300/25 blur-3xl animate-blob [animation-delay:7s]" />
      </div>

      <div className="relative my-auto max-w-md">
        <h2 className="text-4xl font-extrabold leading-tight tracking-tight">
          O&apos;zingizga mos uyni 2 daqiqada toping.
        </h2>
        <p className="mt-4 text-white/80">
          5000+ talaba allaqachon ishonadi. HEMIS verifikatsiya, kuratorlar nazorati va 24
          soatlik refund kafolati.
        </p>

        {/* mock card */}
        <div className="mt-10 rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="h-16 w-20 shrink-0 rounded-lg bg-gradient-to-br from-yellow-300 to-orange-400" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-xs text-white/70">
                <span className="rounded bg-yellow-400 px-1.5 py-0.5 font-bold text-foreground">
                  TOP
                </span>
                <span className="inline-flex items-center gap-1">
                  <Star className="h-3 w-3 fill-yellow-300 text-yellow-300" /> 4.9
                </span>
              </div>
              <div className="mt-1 truncate font-semibold">2 xonali, TUIT yaqinida</div>
              <div className="mt-0.5 flex items-center gap-2 text-xs text-white/70">
                <span className="inline-flex items-center gap-1">
                  <Bed className="h-3 w-3" /> 2 xona
                </span>
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> 1.2 km
                </span>
              </div>
            </div>
            <div className="text-right text-sm font-bold">
              2 500 000<span className="block text-[10px] font-normal text-white/70">so&apos;m/oy</span>
            </div>
          </div>
        </div>

        {/* trust pills */}
        <div className="mt-8 flex flex-wrap gap-2 text-xs">
          {[
            { icon: ShieldCheck, label: "HEMIS verified" },
            { icon: Star, label: "4.9 / 5 reyting" },
          ].map((t) => (
            <span
              key={t.label}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 backdrop-blur-md"
            >
              <t.icon className="h-3.5 w-3.5" />
              {t.label}
            </span>
          ))}
        </div>
      </div>

      <div className="relative mt-auto text-xs text-white/70">
        © {new Date().getFullYear()} TTJ Platforma · Talabalar uchun yaratilgan
      </div>
    </div>
  );
}
