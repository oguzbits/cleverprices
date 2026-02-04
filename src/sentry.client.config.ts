import * as Sentry from "@sentry/nextjs";

console.log("[Sentry] Client initialization starting...");
Sentry.init({
  dsn:
    process.env.NEXT_PUBLIC_SENTRY_DSN ||
    "https://1e7c15cec2b675492e1f5447c51d330c@o4510817678196736.ingest.de.sentry.io/4510817689469008",

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: 0.05,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: true,

  replaysOnErrorSampleRate: 0.1,

  // This sets the sample rate to be 10%. You may want this to be 100% while
  // in development and sample at a lower rate in production
  replaysSessionSampleRate: 0.01,

  // You can remove this option if you're not planning to use the Sentry browser profiling integration
  integrations: [
    Sentry.replayIntegration({
      // Additional Replay configuration goes in here, for example:
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
});
