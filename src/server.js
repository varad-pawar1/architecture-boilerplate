import "./env.js";
import http from "http";
import app from "./server/app.js";

/** Side-effect: Redis `ready` → BullMQ queue + worker (see `config/scheduling.js`) */
import "./config/scheduling.js";

const port = process.env.PORT || 3000;
const server = http.createServer(app);

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

process.on("SIGINT", () => {
  console.log("\nGraceful shutdown (SIGINT)");
  process.exit(0);
});
