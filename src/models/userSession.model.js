import mongoose from "mongoose";

const usersessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "user",
    },
    ip: {
      type: String,
      default: "",
    },
    browser: {
      type: String,
      default: "",
    },
    sessionId: {
      type: String,
      default: "",
    },
    user_agent: {
      version: { type: String, default: "" },
      os: { type: String, default: "" },
      platform: { type: String, default: "" },
      source: { type: String, default: "" },
    },
    expiresAt: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE"],
      default: "ACTIVE",
    },
  },
  {
    timestamps: true,
  }
);

const UserSession = mongoose.model("usersession", usersessionSchema, "usersessions");

export default UserSession;
