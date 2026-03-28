import winston from "winston";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logsDir = path.join(__dirname, "..", "logs");

const options = {
  errorFile: {
    level: "error",
    filename: path.join(logsDir, "error.log"),
    handleExceptions: true,
    maxsize: 5242880,
    maxFiles: 5,
    json: true,
    colorize: false,
  },
  infoFile: {
    level: "info",
    filename: path.join(logsDir, "info.log"),
    handleExceptions: true,
    maxsize: 5242880,
    maxFiles: 5,
    json: true,
    colorize: false,
  },
  console: {
    level: "debug",
    handleExceptions: true,
  },
};

const logger = winston.createLogger({
  transports: [
    new winston.transports.File(options.errorFile),
    new winston.transports.File(options.infoFile),
    new winston.transports.Console(options.console),
  ],
  exitOnError: false,
});

export default logger;
