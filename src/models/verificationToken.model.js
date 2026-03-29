import mongoose from "mongoose";

const VerificationTokenSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
      index: true,
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    action: {
      type: String,
      enum: ["verify-email"],
      default: "verify-email",
    },
    expires_at: { type: Date, required: true },
  },
  { timestamps: true }
);

export const VerificationToken = mongoose.model("verificationToken", VerificationTokenSchema);
