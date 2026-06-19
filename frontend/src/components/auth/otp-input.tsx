"use client";

import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (v: string) => void;
  onComplete?: (v: string) => void;
  autoFocus?: boolean;
  disabled?: boolean;
}

export function OtpInput({
  length = 6,
  value,
  onChange,
  onComplete,
  autoFocus = true,
  disabled,
}: OtpInputProps) {
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.padEnd(length, " ").slice(0, length).split("");

  useEffect(() => {
    if (autoFocus) inputs.current[0]?.focus();
  }, [autoFocus]);

  const setDigit = (i: number, d: string) => {
    const arr = digits.slice();
    arr[i] = d;
    const next = arr.join("").trimEnd();
    onChange(next);
    if (next.length === length) onComplete?.(next);
  };

  return (
    <div className="flex items-center justify-between gap-2">
      {Array.from({ length }).map((_, i) => {
        const ch = digits[i].trim();
        return (
          <input
            key={i}
            ref={(el) => {
              inputs.current[i] = el;
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={ch}
            disabled={disabled}
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, "").slice(-1);
              setDigit(i, v);
              if (v && i < length - 1) inputs.current[i + 1]?.focus();
            }}
            onKeyDown={(e) => {
              if (e.key === "Backspace" && !ch && i > 0) {
                inputs.current[i - 1]?.focus();
                setDigit(i - 1, "");
              } else if (e.key === "ArrowLeft" && i > 0) {
                inputs.current[i - 1]?.focus();
              } else if (e.key === "ArrowRight" && i < length - 1) {
                inputs.current[i + 1]?.focus();
              }
            }}
            onPaste={(e) => {
              const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
              if (!pasted) return;
              e.preventDefault();
              onChange(pasted);
              inputs.current[Math.min(pasted.length, length - 1)]?.focus();
              if (pasted.length === length) onComplete?.(pasted);
            }}
            className={cn(
              "h-14 w-12 rounded-xl border-2 bg-card text-center text-2xl font-bold tabular-nums transition",
              "focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15",
              ch ? "border-primary/40" : "border-input",
            )}
          />
        );
      })}
    </div>
  );
}
