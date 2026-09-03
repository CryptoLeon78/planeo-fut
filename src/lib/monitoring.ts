/**
 * Monitorización ligera de cliente: errores no capturados, promesas rechazadas
 * y métricas de rendimiento (Web Vitals básicos) sin dependencias externas.
 */

export type MonitoringEvent = {
  type: "error" | "unhandledrejection" | "metric";
  name: string;
  message?: string;
  value?: number;
  url: string;
  timestamp: string;
};

const buffer: MonitoringEvent[] = [];
const MAX_BUFFER = 50;
let started = false;

export function getMonitoringBuffer(): MonitoringEvent[] {
  return [...buffer];
}

export function recordEvent(event: Omit<MonitoringEvent, "timestamp" | "url">) {
  const entry: MonitoringEvent = {
    ...event,
    url: typeof window === "undefined" ? "" : window.location.pathname,
    timestamp: new Date().toISOString(),
  };
  buffer.push(entry);
  if (buffer.length > MAX_BUFFER) buffer.shift();
  if (entry.type === "metric") {
    console.info(`[monitoring] ${entry.name}: ${Math.round(entry.value ?? 0)}ms`);
  } else {
    console.error(`[monitoring] ${entry.name}`, entry.message);
  }
  return entry;
}

/** Inicializa los listeners. Idempotente y seguro en SSR. */
export function initMonitoring(): () => void {
  if (started || typeof window === "undefined") return () => {};
  started = true;

  const onError = (event: ErrorEvent) => {
    recordEvent({ type: "error", name: event.error?.name ?? "Error", message: event.message });
  };
  const onRejection = (event: PromiseRejectionEvent) => {
    const reason = event.reason;
    recordEvent({
      type: "unhandledrejection",
      name: "UnhandledRejection",
      message: reason instanceof Error ? reason.message : String(reason),
    });
  };

  window.addEventListener("error", onError);
  window.addEventListener("unhandledrejection", onRejection);

  const observers: PerformanceObserver[] = [];
  const observe = (type: string, name: string, pick: (entry: PerformanceEntry) => number) => {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) recordEvent({ type: "metric", name, value: pick(entry) });
      });
      observer.observe({ type, buffered: true } as PerformanceObserverInit);
      observers.push(observer);
    } catch {
      /* métrica no soportada en este navegador */
    }
  };

  observe("largest-contentful-paint", "LCP", (entry) => entry.startTime);
  observe("paint", "FCP", (entry) => entry.startTime);
  observe("longtask", "long-task", (entry) => entry.duration);

  return () => {
    window.removeEventListener("error", onError);
    window.removeEventListener("unhandledrejection", onRejection);
    for (const observer of observers) observer.disconnect();
    started = false;
  };
}
