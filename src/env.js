import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, "..", ".env");

const result = dotenv.config({ path: envPath });

if (result.error && process.env.NODE_ENV !== "test") {
  console.warn(
    `[env] No file at ${envPath} — using process.env only. Copy .env.example to .env and set DB_URL.`
  );
}
