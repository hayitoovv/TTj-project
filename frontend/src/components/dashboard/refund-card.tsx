import { AlertCircle, CheckCircle2, RefreshCw } from "lucide-react";

export function RefundCard() {
  return (
    <div className="overflow-hidden rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 via-white to-blue-50 p-1 shadow-sm">
      <div className="flex items-start gap-5 rounded-xl bg-card p-5 sm:gap-6 sm:p-6">
        {/* 24h badge */}
        <div className="relative shrink-0">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-lg shadow-blue-500/30 sm:h-20 sm:w-20">
            <div className="text-center">
              <RefreshCw className="mx-auto h-4 w-4 sm:h-5 sm:w-5" />
              <div className="mt-0.5 text-xs font-bold sm:text-sm">24h</div>
            </div>
          </div>
        </div>

        <div className="flex-1">
          <h3 className="text-lg font-bold tracking-tight sm:text-xl">
            24 Soatlik Refund Tizimi
          </h3>
          <div className="mt-1 h-px w-16 bg-blue-200" />

          <ul className="mt-4 space-y-2.5">
            <li className="flex items-start gap-2.5 text-sm">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-100">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
              </span>
              <span>
                <strong className="font-semibold">24 soat ichida</strong> pulingizni
                qaytarib olishingiz mumkin.
              </span>
            </li>
            <li className="flex items-start gap-2.5 text-sm">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100">
                <AlertCircle className="h-3.5 w-3.5 text-red-600" />
              </span>
              <span>
                <strong className="font-semibold text-red-600">24 soatdan keyin</strong>{" "}
                pul qaytarilmaydi.
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
