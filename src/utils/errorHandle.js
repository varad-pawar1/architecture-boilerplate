import ApiError from "./apiError.js";
import { logApiError } from "./customErrorLogger.js";

export default function errorHandler(err, req, res, next) {
  const statusCode = err.status || 500;
  logApiError(err, req);
  return res.status(statusCode).json({
    success: false,
    error: {
      code: statusCode,
      trace: null,
      message: err.message,
      name: err?.name || "Error",
    },
  });
}

export { ApiError };
