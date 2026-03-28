export const getRedisConfig = () => {
  const redisConfig = {
    host: process.env.QUEUE_REDIS_HOST,
    port: process.env.QUEUE_REDIS_PORT,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    timeout: 180,
  };
  if (process.env.NODE_ENV !== "development") {
    redisConfig.tls = {};
  }
  if (process.env.QUEUE_REDIS_PASSWORD) {
    redisConfig.username = process.env.QUEUE_REDIS_USERNAME || "";
    redisConfig.password = process.env.QUEUE_REDIS_PASSWORD || "";
  }
  return redisConfig;
};

export const jobOptions = {
  attempts: 3,
  backoff: {
    type: "exponential",
    delay: 2000,
  },
  removeOnComplete: 100,
  removeOnFail: 50,
};

/** Same name as in `scheduling.js` — use for extra workers or dashboards */
export const BOILERPLATE_QUEUE_NAME = "BOILERPLATE_APP_QUEUE";
