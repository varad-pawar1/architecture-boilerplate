import { Queue, Worker } from "bullmq";
import redisConnection from "./redis-connect.js";

const QUEUE_NAME = "BOILERPLATE_APP_QUEUE";

let appQueue;
let appWorker;
let queueBooted = false;

let resolveQueueReady;
let rejectQueueReady;
export const whenQueueReady = new Promise((resolve, reject) => {
  resolveQueueReady = resolve;
  rejectQueueReady = reject;
});

async function processDemoJob(job) {
  console.log("[Worker] demo-job", job.id, job.data);
  return { ok: true, processedAt: new Date().toISOString() };
}

export async function initializeAppQueue() {
  console.log("\x1b[32m%s\x1b[0m", "[Q1] BullMQ queue + worker init...");

  appQueue = new Queue(QUEUE_NAME, {
    connection: redisConnection,
    prefix: "{bull}",
  });

  appWorker = new Worker(
    QUEUE_NAME,
    async (job) => {
      if (job.name === "demo-job") {
        return processDemoJob(job);
      }
      console.log("[Worker] unhandled job name:", job.name);
      return null;
    },
    { connection: redisConnection, concurrency: 2, prefix: "{bull}" }
  );

  appWorker.on("error", (err) => {
    console.log("Worker error", err);
  });

  appWorker.on("completed", (job) => {
    console.log("[Worker] completed", job.id);
  });

  appWorker.on("failed", (job, err) => {
    console.log("[Worker] failed", job?.id, err?.message);
  });

  resolveQueueReady();
}

function bootQueue() {
  if (queueBooted) return;
  queueBooted = true;
  initializeAppQueue().catch((e) => {
    console.error("initializeAppQueue", e);
    if (rejectQueueReady) rejectQueueReady(e);
  });
}

if (redisConnection.status === "ready") {
  console.log("\x1b[33m%s\x1b[0m", "[R2] Redis already ready — starting BullMQ...");
  bootQueue();
} else {
  redisConnection.once("ready", () => {
    console.log("\x1b[33m%s\x1b[0m", "[R2] Redis ready — starting BullMQ...");
    bootQueue();
  });
}

export async function addDemoJob(payload = {}) {
  await whenQueueReady;
  if (!appQueue) {
    throw new Error("Queue not initialized");
  }
  await appQueue.add("demo-job", payload, {
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
  });
}

export async function closeAppQueue() {
  if (appWorker) await appWorker.close();
  if (appQueue) await appQueue.close();
}
