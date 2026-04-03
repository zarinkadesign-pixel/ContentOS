"use client";
import { useEffect } from "react";

// Silently captures unhandled JS errors and promise rejections,
// sends them to /api/bugs which writes to bugs.log on the server.
export default function BugReporter() {
  useEffect(() => {
    function report(message: string, stack = "") {
      // Ignore non-errors and 3rd-party noise
      if (!message || message.includes("ResizeObserver") || message.includes("ChunkLoadError")) return;

      void fetch("/api/bugs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          stack,
          url:       window.location.href,
          userAgent: navigator.userAgent,
        }),
        keepalive: true,
      }).catch(() => {});
    }

    function onError(event: ErrorEvent) {
      report(event.message, event.error?.stack ?? "");
    }

    function onUnhandledRejection(event: PromiseRejectionEvent) {
      const msg = event.reason instanceof Error
        ? event.reason.message
        : String(event.reason);
      const stack = event.reason instanceof Error ? event.reason.stack ?? "" : "";
      report(msg, stack);
    }

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onUnhandledRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
    };
  }, []);

  return null; // renders nothing
}
