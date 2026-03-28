"use strict";
import Redis from "ioredis";

const initializeRedisConnection = () => {
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
  const connection = new Redis(redisConfig);

  connection.on("connect", () => {
    console.log("\x1b[33m%s\x1b[0m", "[R1] Redis connected!");
  });
  connection.on("error", (err) => {
    console.log("\x1b[31m%s\x1b[0m", "[R3] Redis ERROR!");
    console.log(err);
  });
  connection.on("ready", () => {
    console.log("\x1b[33m%s\x1b[0m", "[R2] Redis ready!");
  });
  connection.on("end", () => {
    console.log("[R4] Redis connection END...");
  });
  connection.on("close", () => {
    console.log("\x1b[33m%s\x1b[0m", "[RN] Redis connection closed...");
  });
  return connection;
};

const redisConnection = initializeRedisConnection();
export default redisConnection;
