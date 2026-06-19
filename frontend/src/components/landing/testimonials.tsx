import { Quote, Star } from "lucide-react";

const testimonials = [
  {
    name: "Diyora R.",
    role: "TUIT, 2-kurs",
    avatar: "from-blue-400 to-blue-600",
    initial: "D",
    rating: 5,
    text: "Ilk marta o'qishga kelganimda uy izlash 2 hafta vaqt oldi. TTJ orqali esa 2 kunda topdim — HEMIS bilan tasdiqlanganim uchun uy egalari ham ishonib qabul qilishdi.",
  },
  {
    name: "Sherzod M.",
    role: "Uy egasi, Yunusobod",
    avatar: "from-yellow-400 to-orange-500",
    initial: "S",
    rating: 5,
    text: "Avval Telegram kanallarda e'lon joylab yuribdim — ko'p javobsiz so'rovlar. Bu yerda esa faqat haqiqiy talabalar. 1 oyda 3 ta xonadon ijaraga oldim.",
  },
  {
    name: "Madina K.",
    role: "Toshkent Davlat Universiteti, 3-kurs",
    avatar: "from-pink-400 to-rose-600",
    initial: "M",
    rating: 5,
    text: "To'lov Click orqali xavfsiz o'tdi, refund kafolati ham bor edi. Uy esa rasmda ko'rsatilgani bilan to'liq mos keldi. Kurator ham bog'lanib turdi.",
  },
  {
    name: "Akmal T.",
    role: "Uy egasi, Mirzo Ulug'bek",
    avatar: "from-emerald-400 to-teal-600",
    initial: "A",
    rating: 4,
    text: "PRO tarifga o'tganimdan keyin e'lonim TOP'ga chiqdi — ko'rishlar 4 baravar oshdi. Endi har oy daromad panelimdan kuzatib boraman.",
  },
  {
    name: "Nigora B.",
    role: "Inha Universiteti, 1-kurs",
    avatar: "from-violet-400 to-purple-600",
    initial: "N",
    rating: 5,
    text: "Ota-onam Toshkentda emas — onam internetdan bron qilib berdi. Hujjatlar, shartnoma — hammasi ilova ichida bor.",
  },
  {
    name: "Bekzod O.",
    role: "Westminster Univ., 4-kurs",
    avatar: "from-orange-400 to-red-600",
    initial: "B",
    rating: 5,
    text: "Kurator orqali bir muammoni 1 soat ichida hal qildim. Chat va to'lov tizimi juda tez ishlaydi.",
  },
];

export function Testimonials() {
  return (
    <section className="relative overflow-hidden border-y bg-gradient-to-b from-muted/20 via-background to-muted/10 py-24">
      {/* decorative blobs */}
      <div className="pointer-events-none absolute -top-32 left-1/4 -z-10 h-72 w-72 rounded-full bg-blue-400/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 right-1/4 -z-10 h-72 w-72 rounded-full bg-yellow-400/15 blur-3xl" />

      <div className="container mx-auto max-w-6xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-primary">
            Sharhlar
          </span>
          <h2 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
            Talabalar va uy egalari{" "}
            <span className="text-gradient-brand">aytishadi</span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            5000+ talaba va 1500+ uy egasi ishonadi.
          </p>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t, idx) => (
            <div
              key={t.name}
              className="relative rounded-2xl border bg-card p-6 transition hover:-translate-y-1 hover:shadow-xl"
              style={{ animationDelay: `${idx * 80}ms` }}
            >
              <Quote className="absolute right-5 top-5 h-6 w-6 text-muted-foreground/20" />

              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={
                      i < t.rating
                        ? "h-3.5 w-3.5 fill-yellow-400 text-yellow-400"
                        : "h-3.5 w-3.5 text-muted-foreground/30"
                    }
                  />
                ))}
              </div>

              <p className="mt-4 text-sm leading-relaxed text-foreground/90">
                &ldquo;{t.text}&rdquo;
              </p>

              <div className="mt-6 flex items-center gap-3 border-t pt-4">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${t.avatar} text-sm font-bold text-white`}
                >
                  {t.initial}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{t.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
