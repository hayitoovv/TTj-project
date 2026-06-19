/* eslint-disable @typescript-eslint/no-explicit-any */
let promise: Promise<any> | null = null;

export function loadYmaps(): Promise<any> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("ymaps load attempted on server"));
  }

  if (promise) return promise;

  const w = window as any;
  if (w.ymaps && typeof w.ymaps.ready === "function") {
    promise = new Promise((resolve) => w.ymaps.ready(() => resolve(w.ymaps)));
    return promise;
  }

  const apiKey = process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY ?? "";
  const lang = "uz_UZ";
  const src = `https://api-maps.yandex.ru/2.1/?lang=${lang}${apiKey ? `&apikey=${apiKey}` : ""}`;

  promise = new Promise((resolve, reject) => {
    // Reuse if a script tag already exists (HMR scenarios)
    const existing = document.querySelector<HTMLScriptElement>(
      "script[data-ymaps-loader]",
    );
    const onReady = () => {
      const w2 = window as any;
      if (w2.ymaps && typeof w2.ymaps.ready === "function") {
        w2.ymaps.ready(() => resolve(w2.ymaps));
      } else {
        reject(new Error("ymaps not available after script load"));
      }
    };

    if (existing) {
      if ((window as any).ymaps?.ready) {
        onReady();
      } else {
        existing.addEventListener("load", onReady, { once: true });
        existing.addEventListener("error", () => reject(new Error("ymaps script failed")), {
          once: true,
        });
      }
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.dataset.ymapsLoader = "true";
    script.onload = onReady;
    script.onerror = () => {
      promise = null;
      reject(new Error("Failed to load Yandex Maps script"));
    };
    document.head.appendChild(script);
  });

  return promise;
}
