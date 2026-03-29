import { Queue, Worker } from "bullmq";
import redisConnection from "./redis-connect.js";
import { processSendEmailJob } from "../v1/services/email/email.job.processor.js";

/**
 * Single BullMQ queue for this app. The Worker runs inside the same Node process as the HTTP server
 * (started from `src/server.js` when Redis becomes ready). For heavy traffic, move workers to
 * separate processes: `node src/workers/email.worker.js` (see comment at bottom of this file).
 */
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
      if (job.name === "send-email") {
        return processSendEmailJob(job);
      }
      console.log("[Worker] unhandled job name:", job.name);
      return null;
    },
    { connection: redisConnection, concurrency: 5, prefix: "{bull}" }
  );

  appWorker.on("error", (err) => {
    console.log("Worker error", err);
  });

  appWorker.on("completed", (job) => {
    console.log("[Worker] completed", job.name, job.id);
  });

  appWorker.on("failed", (job, err) => {
    console.error("[Worker] failed", job?.name, job?.id, err?.message);
    if (err?.stack) console.error(err.stack);
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

const emailJobOpts = {
  attempts: 5,
  backoff: { type: "exponential", delay: 3000 },
  removeOnComplete: 500,
  removeOnFail: 200,
};

const QUEUE_READY_MS = 20_000;

export async function addEmailJob(payload) {
  await Promise.race([
    whenQueueReady,
    new Promise((_, reject) =>
      setTimeout(
        () =>
          reject(
            new Error(
              "Email queue not ready (Redis?). Start Redis or set QUEUE_REDIS_* in .env — emails cannot be queued."
            )
          ),
        QUEUE_READY_MS
      )
    ),
  ]);
  if (!appQueue) {
    throw new Error("Queue not initialized");
  }
  return appQueue.add("send-email", payload, emailJobOpts);
}

export async function closeAppQueue() {
  if (appWorker) await appWorker.close();
  if (appQueue) await appQueue.close();
}

/*
 * Optional scale-out: run workers in a dedicated process so API and email throughput are isolated.
 *   node src/workerProcess.js
 * That file would import only redis + Worker (same QUEUE_NAME) and omit HTTP. Not required for small deployments.
 */
