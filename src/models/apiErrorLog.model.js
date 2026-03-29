import mongoose from "mongoose";

const ApiErrorLogSchema = new mongoose.Schema(
  {
    statusCode: { type: Number, default: 500 },
    message: { type: String, required: true },
    name: { type: String, default: "Error" },
    stack: { type: String, default: "" },
    path: { type: String, default: "" },
    method: { type: String, default: "" },
    ip: { type: String, default: "" },
    userAgent: { type: String, default: "" },
    requestBody: { type: mongoose.Schema.Types.Mixed, default: null },
    requestQuery: { type: mongoose.Schema.Types.Mixed, default: null },
    requestParams: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: true, collection: "apierrorlog" }
);

export const ApiErrorLog = mongoose.model("ApiErrorLog", ApiErrorLogSchema);
