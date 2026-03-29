import mongoose from "mongoose";

const EmailErrorLogSchema = new mongoose.Schema(
  {
    message: { type: String, required: true },
    name: { type: String, default: "Error" },
    stack: { type: String, default: "" },
    to: { type: String, default: "" },
    templateSlug: { type: String, default: "" },
    subject: { type: String, default: "" },
    jobId: { type: String, default: "" },
    payload: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: true, collection: "emailerrorlog" }
);

export const EmailErrorLog = mongoose.model("EmailErrorLog", EmailErrorLogSchema);
