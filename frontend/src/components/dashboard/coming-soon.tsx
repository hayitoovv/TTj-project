import { ArrowLeft, Hammer } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

interface ComingSoonProps {
  title: string;
  description: string;
}

export function ComingSoon({ title, description }: ComingSoonProps) {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="overflow-hidden rounded-2xl border bg-gradient-to-br from-blue-50 via-white to-yellow-50 p-10 text-center sm:p-16">
        <div className="mx-auto inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-yellow-400 text-white shadow-lg shadow-blue-500/30">
          <Hammer className="h-9 w-9" />
        </div>
        <h1 className="mt-6 text-3xl font-extrabold tracking-tight md:text-4xl">
          {title}
        </h1>
        <p className="mx-auto mt-3 max-w-md text-muted-foreground">{description}</p>
        <div className="mt-8 inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-yellow-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-yellow-500" />
          </span>
          Tez orada keladi
        </div>
        <div className="mt-8">
          <Button asChild variant="outline">
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
