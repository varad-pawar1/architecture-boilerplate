import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";

function normalizeMongoUrl(raw) {
  if (!raw || typeof raw !== "string") return "";
  let s = raw.trim();
  if (
    (s.startsWith('"') && s.endsWith('"')) ||
    (s.startsWith("'") && s.endsWith("'"))
  ) {
    s = s.slice(1, -1).trim();
  }
  return s;
}

export default async function dbConnect() {
  const DB_URL = normalizeMongoUrl(process.env.DB_URL);
  const backendRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
  const envFile = path.join(backendRoot, ".env");

  if (!DB_URL) {
    console.error(
      `[db] DB_URL is missing or empty.\n` +
        `  Create ${envFile} (copy from .env.example) and set:\n` +
        `  DB_URL=mongodb://127.0.0.1:27017/mvc_boilerplate`
    );
    process.exit(1);
  }

  if (!DB_URL.startsWith("mongodb://") && !DB_URL.startsWith("mongodb+srv://")) {
    console.error(
      `[db] DB_URL must start with mongodb:// or mongodb+srv://\n` +
        `  Current value looks invalid (check for spaces or stray quotes in ${envFile}).`
    );
    process.exit(1);
  }

  try {
    await mongoose.connect(DB_URL);
    if (process.env.NODE_ENV === "development") {
      mongoose.set("debug", true);
    }
    const db = mongoose.connection;

    db.on("error", console.error.bind(console, "MongoDB connection error"));

    db.on("connected", function () {
      console.log("[1] Mongoose connected");
    });

    db.once("open", () => {
      console.log("[2] MongoDB connection ready");
    });

    db.on("disconnected", function () {
      console.log("[3] Mongoose disconnected");
    });

    process.on("SIGINT", function () {
      db.close();
    });

    const { seedEmailTemplates } = await import("../seedEmailTemplates.js");
    await seedEmailTemplates();
  } catch (err) {
    console.error("dbConnect error =>", err.message);
    console.error(
      `[db] Fix DB_URL in Backend/.env and ensure MongoDB is running (local or Atlas).`
    );
    process.exit(1);
  }
}
