import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import { ApiErrorLog } from "../models/apiErrorLog.model.js";
import { EmailErrorLog } from "../models/emailErrorLog.model.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logsDir = path.join(__dirname, "..", "logs");
const apiErrorFile = path.join(logsDir, "api-error.log");
const emailErrorFile = path.join(logsDir, "email-error.log");

async function appendJsonLine(filePath, payload) {
  try {
    await fs.mkdir(logsDir, { recursive: true });
    await fs.appendFile(filePath, `${JSON.stringify(payload)}\n`, "utf8");
  } catch (err) {
    console.error("[custom-error-logger] failed to append file log:", err?.message || err);
  }
}

function isDbReady() {
  return mongoose.connection?.readyState === 1;
}

function cleanRequestBody(body) {
  if (!body || typeof body !== "object") return body || null;
  const clone = { ...body };
  if ("password" in clone) clone.password = "[REDACTED]";
  if ("confirmPassword" in clone) clone.confirmPassword = "[REDACTED]";
  if ("token" in clone) clone.token = "[REDACTED]";
  return clone;
}

export async function logApiError(err, req) {
  const payload = {
    at: new Date().toISOString(),
    type: "api_error",
    statusCode: err?.status || 500,
    message: err?.message || "Unknown API error",
    name: err?.name || "Error",
    stack: err?.stack || "",
    path: req?.originalUrl || req?.url || "",
    method: req?.method || "",
    ip: req?.ip || "",
    userAgent: req?.headers?.["user-agent"] || "",
    requestBody: cleanRequestBody(req?.body),
    requestQuery: req?.query || null,
    requestParams: req?.params || null,
  };

  await appendJsonLine(apiErrorFile, payload);

  if (!isDbReady()) return;
  try {
    await ApiErrorLog.create(payload);
  } catch (dbErr) {
    console.error("[custom-error-logger] failed to save API error log:", dbErr?.message || dbErr);
  }
}

export async function logEmailError(err, details = {}) {
  const payload = {
    at: new Date().toISOString(),
    type: "email_error",
    message: err?.message || "Unknown email error",
    name: err?.name || "Error",
    stack: err?.stack || "",
    to: details?.to || "",
    templateSlug: details?.templateSlug || "",
    subject: details?.subject || "",
    jobId: details?.jobId ? String(details.jobId) : "",
    payload: details?.payload || null,
  };

  await appendJsonLine(emailErrorFile, payload);

  if (!isDbReady()) return;
  try {
    await EmailErrorLog.create(payload);
  } catch (dbErr) {
    console.error("[custom-error-logger] failed to save email error log:", dbErr?.message || dbErr);
  }
}
