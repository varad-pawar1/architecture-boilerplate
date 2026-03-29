import "./env.js";
import http from "http";
import app from "./server/app.js";

/**
 * BullMQ worker(s) are started from `./config/scheduling.js` when Redis fires `ready`.
 * You do not run a separate command for workers in the default setup — `npm run dev` or `npm start`
 * loads this file → Redis → queue + Worker in-process.
 *
 * To scale workers horizontally, run additional Node processes that only attach Workers to the same
 * queue name (see the comment at the bottom of `config/scheduling.js`).
 */
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
