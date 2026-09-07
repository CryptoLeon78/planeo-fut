export function registerServiceWorker(): (() => void) | undefined {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return undefined;
  let cancelled = false;
  void navigator.serviceWorker.register("/sw.js", { scope: "/" }).then((registration) => {
    if (cancelled) return;
    registration.update().catch(() => undefined);
  }).catch(() => undefined);
  return () => { cancelled = true; };
}
