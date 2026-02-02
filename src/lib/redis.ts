import Redis from "ioredis";

const getRedisUrl = () => {
  if (process.env.REDIS_URL) {
    return process.env.REDIS_URL;
  }
  return "redis://localhost:6379";
};

const globalForRedis = global as unknown as { redis: Redis | undefined };

const createRedis = () => {
  const client = new Redis(getRedisUrl(), {
    maxRetriesPerRequest: null,
    retryStrategy(times: number) {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
  });

  client.on("error", (err) => {
    // Suppress errors to prevent app crashes, especially during build
    // but log them for visibility
    if (process.env.NODE_ENV === "production" || process.env.DEBUG_REDIS) {
      console.error("[Redis Error]", err.message);
    }
  });

  return client;
};

export const redis = globalForRedis.redis ?? createRedis();

if (process.env.NODE_ENV !== "production") globalForRedis.redis = redis;

export default redis;
