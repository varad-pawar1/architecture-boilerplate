import "../env.js";
import express from "express";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import cors from "cors";
import compression from "compression";
import winston from "../config/winston.js";
import V1Routes from "../v1/routes/index.js";
import dbConnect from "../config/db/dbConnect.js";
import errorHandler from "../utils/errorHandle.js";

await dbConnect();

const app = express();

app.use(compression());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: false }));
app.use(
  morgan(":method :url :status :res[content-length] - :response-time ms", {
    stream: {
      write: (message) => winston.info(message.trim()),
    },
  })
);
app.use(cookieParser());

const corsOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",").map((s) => s.trim())
  : ["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:4200", "http://127.0.0.1:4200","http://localhost:5173"];

const corsOptions = {
  origin: corsOrigins,
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
  allowedHeaders: ["Content-Type", "Authorization", "x-refresh-token"],
  credentials: true,
};

app.use(cors(corsOptions));

app.get("/", (req, res) => {
  return res.json({ success: true, message: "mvc-architecture-boilerplate API" });
});

app.use("/v1", V1Routes);

app.use(errorHandler);

export default app;
