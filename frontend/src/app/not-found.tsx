import { ArrowLeft, Home } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <div className="relative">
        <div className="text-[180px] font-extrabold leading-none text-gradient-brand opacity-90 md:text-[240px]">
          404
        </div>
        <div className="absolute -inset-8 -z-10 rounded-full bg-gradient-to-br from-blue-500/10 to-yellow-400/10 blur-3xl" />
      </div>
      <h1 className="mt-4 text-2xl font-bold tracking-tight md:text-3xl">
        Sahifa topilmadi
      </h1>
      <p className="mt-3 max-w-md text-muted-foreground">
        Siz qidirayotgan sahifa mavjud emas yoki ko&apos;chirilgan. Bosh sahifaga qayting yoki
        boshqa joydan boshlang.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button asChild size="lg">
          <Link href="/">
            <Home className="h-4 w-4" />
            Bosh sahifa
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/houses">
            <ArrowLeft className="h-4 w-4" />
            Uylarga qaytish
          </Link>
        </Button>
      </div>
    </div>
  );
}
