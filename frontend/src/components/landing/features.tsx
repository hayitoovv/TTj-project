import {
  Banknote,
  GraduationCap,
  MapPin,
  MessageSquare,
  RefreshCw,
  Shield,
  Star,
} from "lucide-react";

export function Features() {
  return (
    <section id="features" className="container mx-auto max-w-6xl px-4 py-24">
      <div className="mx-auto max-w-2xl text-center">
        <span className="text-sm font-semibold uppercase tracking-wider text-primary">
          Imkoniyatlar
        </span>
        <h2 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
          Boshqa platformalarda <span className="text-gradient-brand">topa olmaysiz</span>
        </h2>
        <p className="mt-4 text-muted-foreground">
          Talaba xavfsizligi va qulayligi uchun maxsus ishlab chiqilgan.
        </p>
      </div>

      <div className="mt-14 grid gap-4 md:grid-cols-3 lg:grid-cols-4">
        {/* HEMIS - big tile */}
        <div className="md:col-span-2 lg:col-span-2 lg:row-span-2 group relative overflow-hidden rounded-2xl border bg-gradient-to-br from-blue-600 to-blue-800 p-8 text-white">
          <div className="pointer-events-none absolute -right-8 -top-8 h-48 w-48 rounded-full bg-white/10 blur-2xl transition-transform group-hover:scale-110" />
          <GraduationCap className="h-10 w-10" />
          <h3 className="mt-6 text-2xl font-bold">HEMIS verifikatsiya</h3>
          <p className="mt-3 max-w-md text-white/80">
            Talaba ekanligingiz universitet tizimi orqali avtomatik tekshiriladi. Soxta hisoblar
            yo&apos;q, faqat haqiqiy talabalar.
          </p>
          {/* mock HEMIS chip */}
          <div className="mt-8 inline-flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3 backdrop-blur-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-blue-700 text-xs font-bold">
              ✓
            </div>
            <div className="text-left">
              <div className="text-xs text-white/70">Tasdiqlandi</div>
              <div className="font-semibold">TUIT • 113-21 KI</div>
            </div>
          </div>
        </div>

        {/* Google Maps */}
        <div className="group rounded-2xl border bg-card p-6 transition hover:shadow-lg hover:-translate-y-1">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
            <MapPin className="h-5 w-5" />
          </div>
          <h3 className="mt-4 font-semibold">Google Maps</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Eng yaqin uylarni xaritada ko&apos;rib, masofani aniqlang.
          </p>
        </div>

        {/* Refund */}
        <div className="group rounded-2xl border bg-gradient-to-br from-yellow-400 to-orange-500 p-6 text-foreground transition hover:shadow-lg hover:-translate-y-1">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/30">
            <RefreshCw className="h-5 w-5" />
          </div>
          <h3 className="mt-4 font-semibold">24 soatlik refund</h3>
          <p className="mt-1 text-sm">
            To&apos;lovdan keyin 24 soat ichida pulingizni qaytaring.
          </p>
        </div>

        {/* Curators */}
        <div className="group rounded-2xl border bg-card p-6 transition hover:shadow-lg hover:-translate-y-1">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-100 text-red-600">
            <Shield className="h-5 w-5" />
          </div>
          <h3 className="mt-4 font-semibold">Kuratorlar nazorati</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Har bir muammo bo&apos;yicha kuratorlar yordam beradi.
          </p>
        </div>

        {/* Chat */}
        <div className="group rounded-2xl border bg-card p-6 transition hover:shadow-lg hover:-translate-y-1">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
            <MessageSquare className="h-5 w-5" />
          </div>
          <h3 className="mt-4 font-semibold">Real-time chat</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Uy egasi va kurator bilan ilova orqali yozishing.
          </p>
        </div>

        {/* Payments — wide tile */}
        <div className="md:col-span-2 lg:col-span-2 group rounded-2xl border bg-card p-6 transition hover:shadow-lg">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-100 text-green-600">
            <Banknote className="h-5 w-5" />
          </div>
          <h3 className="mt-4 font-semibold">4 ta to&apos;lov tizimi</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Sizga qulay tarzda — Click, Payme, Uzum yoki Paynet.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {["Click", "Payme", "Uzum", "Paynet"].map((p) => (
              <span
                key={p}
                className="rounded-md border bg-background px-3 py-1.5 text-xs font-semibold"
              >
                {p}
              </span>
            ))}
          </div>
        </div>

        {/* Reviews */}
        <div className="group rounded-2xl border bg-card p-6 transition hover:shadow-lg hover:-translate-y-1">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-yellow-100 text-yellow-700">
            <Star className="h-5 w-5" />
          </div>
          <h3 className="mt-4 font-semibold">Reyting tizimi</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Talabalar va uy egalari bir-birini baholaydi.
          </p>
        </div>
      </div>
    </section>
  );
}
