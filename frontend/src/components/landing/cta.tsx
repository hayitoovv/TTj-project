"use client";

import { ArrowRight, LayoutDashboard } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth";

export function CTA() {
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);
  const loggedIn = hydrated && !!user;

  return (
    <section className="container mx-auto max-w-6xl px-4 py-24">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-brand px-8 py-16 text-center text-white shadow-2xl shadow-blue-500/30">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-20 -left-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-yellow-300/20 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-2xl">
          <Image src="/logo.png" alt="" width={88} height={88} className="mx-auto opacity-90" />
          <h2 className="mt-6 text-4xl font-extrabold tracking-tight md:text-5xl">
            {loggedIn ? "Davom etamizmi?" : "Bugun boshlang — bepul"}
          </h2>
          <p className="mt-4 text-white/90">
            {loggedIn
              ? "Sizning panelingizda barcha bronlar va sozlamalar mavjud."
              : "Uy izlash davrini tugating. 2 daqiqada ro'yxatdan o'ting va kerakli uyni toping."}
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {loggedIn ? (
              <Button asChild size="lg" variant="secondary" className="shadow-lg">
                <Link href="/dashboard">
                  <LayoutDashboard className="h-4 w-4" />
                  Mening panelim
                </Link>
              </Button>
            ) : (
              <Button asChild size="lg" variant="secondary" className="shadow-lg">
                <Link href="/register">
                  Bepul boshlash
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            )}
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white"
            >
              <Link href="/houses">Uylarni ko&apos;rish</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
