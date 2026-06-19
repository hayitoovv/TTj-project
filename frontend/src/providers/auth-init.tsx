"use client";

import { useEffect } from "react";

import { getAccessToken } from "@/lib/api/client";
import { useAuthStore } from "@/stores/auth";

export function AuthInit() {
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const hydrated = useAuthStore((s) => s.hydrated);

  useEffect(() => {
    if (!hydrated) return;
    if (getAccessToken()) {
      void fetchMe();
    }
  }, [hydrated, fetchMe]);

  return null;
}
