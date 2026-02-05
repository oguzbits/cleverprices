import { init } from "@sentry/nextjs";

console.log("[Sentry] Client initialization starting...");
init({
  dsn:
    process.env.NEXT_PUBLIC_SENTRY_DSN ||
    "https://1e7c15cec2b675492e1f5447c51d330c@o4510817678196736.ingest.de.sentry.io/4510817689469008",

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: 0.05,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,
});
