class ApiError extends Error {
  constructor(statusCode, message, name = "", isOperational = true, stack = "") {
    super(message);
    this.status = statusCode;
    this.name = name;
    this.isOperational = isOperational;
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export default ApiError;
