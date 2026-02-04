import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Low traces for production to avoid CPU overhead
  tracesSampleRate: 0.05,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  // Profiling is temporary disabled to prevent OOM/CPU spikes on production
  profilesSampleRate: 0,
});
