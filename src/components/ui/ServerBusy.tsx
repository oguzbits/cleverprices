"use client";

import { useEffect, useState } from "react";

interface ServerBusyProps {
  title?: string;
  message?: string;
}

/**
 * Premium "Server Busy" fallback component.
 * Uses glassmorphism and subtle animations to maintain a high-end feel during load spikes.
 */
export function ServerBusy({
  title = "Server unter hoher Last",
  message = "Wir verarbeiten gerade viele Anfragen. Das System schützt sich automatisch vor Überlastung.",
}: ServerBusyProps) {
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center bg-gradient-to-b from-white to-gray-50/50 px-4 py-12 text-center">
      <div className="relative mb-12 flex h-32 w-32 items-center justify-center">
        {/* Animated Rings */}
        <div className="absolute inset-0 animate-ping rounded-full bg-amber-400/20 duration-[3000ms]" />
        <div className="absolute inset-4 animate-pulse rounded-full bg-amber-500/10" />

        {/* Central Icon with Glassmorphism */}
        <div className="relative z-10 flex h-20 w-20 items-center justify-center rounded-2xl border border-amber-200/50 bg-white/40 shadow-xl backdrop-blur-md">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="h-10 w-10 text-amber-600"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
            />
          </svg>
        </div>
      </div>

      <div className="max-w-md space-y-6">
        <div className="space-y-2">
          <h2 className="bg-gradient-to-br from-gray-900 to-gray-600 bg-clip-text text-3xl font-bold tracking-tight text-transparent sm:text-4xl">
            {title}
          </h2>
          <p className="text-lg leading-relaxed text-gray-500">{message}</p>
        </div>

        <div className="flex flex-col items-center gap-4 pt-4">
          <button
            onClick={handleRetry}
            className="group relative flex items-center gap-2 overflow-hidden rounded-full bg-gray-900 px-8 py-3 font-semibold text-white transition-all hover:bg-gray-800 hover:shadow-lg active:scale-95"
          >
            <span className="relative z-10">Seite aktualisieren</span>
            <svg
              className="relative z-10 h-4 w-4 transition-transform group-hover:rotate-180"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
          </button>

          <p className="text-sm font-medium text-gray-400">
            {countdown > 0 ? (
              <span>Automatischer Retry möglich in {countdown}s</span>
            ) : (
              <span className="text-amber-600">Bereit zum Aktualisieren</span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
