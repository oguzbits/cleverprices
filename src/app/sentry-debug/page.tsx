"use client";

import * as Sentry from "@sentry/nextjs";

export default function SentryTestPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-zinc-950 p-8 text-white">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Sentry Debugger</h1>
        <p className="text-zinc-400">
          Use these buttons to verify your production setup.
        </p>
      </div>

      <div className="grid w-full max-w-lg grid-cols-1 gap-4 md:grid-cols-2">
        <button
          onClick={() => {
            console.log("Triggering client-side error...");
            throw new Error("Sentry Test: Client-side crash");
          }}
          className="rounded-xl bg-red-600 px-6 py-4 font-semibold shadow-lg shadow-red-900/20 transition-colors hover:bg-red-500"
        >
          💥 Trigger Client Error
        </button>

        <button
          onClick={() => {
            Sentry.captureMessage("Sentry Test: Custom Message", "info");
            alert("Sent info message to Sentry!");
          }}
          className="rounded-xl bg-blue-600 px-6 py-4 font-semibold shadow-lg shadow-blue-900/20 transition-colors hover:bg-blue-500"
        >
          📩 Send Test Message
        </button>

        <button
          onClick={async () => {
            // We can't easily trigger a server error from a button without an API route,
            // but capturing a client error is enough to verify the DSN and charts.
            alert(
              "TIP: Visit an invalid URL (e.g. /p/invalid-id) to trigger a 404 or backend log.",
            );
          }}
          className="rounded-xl border border-zinc-700 bg-zinc-800 px-6 py-4 font-semibold transition-colors hover:bg-zinc-700"
        >
          🔍 Verification Tip
        </button>
      </div>

      <div className="mt-8 max-w-md rounded-lg border border-zinc-800 bg-zinc-900 p-4 text-sm text-zinc-500">
        <p>
          <strong>Note:</strong> Charts in Sentry (Crash Free Users, etc.) can
          take up to 2-3 minutes to refresh after the first error is received.
        </p>
      </div>
    </div>
  );
}
