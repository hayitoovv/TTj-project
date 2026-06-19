import { SearchX } from "lucide-react";

import { Button } from "@/components/ui/button";

export function EmptyState({ onReset }: { onReset?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/30 px-6 py-20 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <SearchX className="h-7 w-7 text-muted-foreground" />
      </div>
      <h3 className="mt-5 text-lg font-semibold">Hech narsa topilmadi</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        Filterlaringizga mos uy yo&apos;q. Boshqa hudud yoki narx oralig&apos;ini sinab ko&apos;ring.
      </p>
      {onReset && (
        <Button onClick={onReset} variant="outline" className="mt-5">
          Filterlarni tozalash
        </Button>
      )}
    </div>
  );
}
