import ApiError from "./apiError.js";

export default function errorHandler(err, req, res, next) {
  const statusCode = err.status || 500;
  console.log(":::::::::::::::::::::::::::::::::::::::::::::::::");
  console.log("Error Encountered");
  console.log(err);
  console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
  return res.status(statusCode).json({
    success: false,
    error: {
      code: err.status,
      trace: null,
      message: err.message,
      name: err?.name,
    },
  });
}

export { ApiError };
