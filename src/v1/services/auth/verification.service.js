import crypto from "crypto";
import moment from "moment";
import { VerificationToken } from "../../../models/verificationToken.model.js";
import ApiError from "../../../utils/apiError.js";

export function hashToken(plain) {
  return crypto.createHash("sha256").update(plain, "utf8").digest("hex");
}

function randomToken() {
  return crypto.randomBytes(32).toString("hex");
}

export async function issueEmailVerificationToken(userId, { replaceExisting = true } = {}) {
  const minutes = parseInt(process.env.VERIFY_EMAIL_EXPIRATION_MINUTES || "1440", 10);
  const expires_at = moment().add(minutes, "minutes").toDate();

  if (replaceExisting) {
    await VerificationToken.deleteMany({ user: userId, action: "verify-email" });
  }

  const plain = randomToken();
  const tokenHash = hashToken(plain);

  await VerificationToken.create({
    user: userId,
    tokenHash,
    action: "verify-email",
    expires_at,
  });

  return { plainToken: plain, expires_at };
}

export async function consumeEmailVerificationToken(plainToken) {
  if (!plainToken || typeof plainToken !== "string") {
    throw new ApiError(400, "Token is required");
  }

  const tokenHash = hashToken(plainToken.trim());
  const record = await VerificationToken.findOne({ tokenHash, action: "verify-email" }).populate(
    "user"
  );

  if (!record || !record.user) {
    throw new ApiError(400, "Invalid or expired verification link");
  }

  if (new Date(record.expires_at).getTime() < Date.now()) {
    await VerificationToken.deleteOne({ _id: record._id });
    throw new ApiError(400, "Verification link has expired");
  }

  const user = record.user;
  user.isEmailVerified = true;
  await user.save();
  await VerificationToken.deleteOne({ _id: record._id });

  return user;
}

export async function issuePasswordResetToken(userId) {
  const minutes = parseInt(process.env.RESET_PASSWORD_EXPIRATION_MINUTES || "60", 10);
  const expires_at = moment().add(minutes, "minutes").toDate();

  // Replace any existing reset tokens for this user
  await VerificationToken.deleteMany({ user: userId, action: "reset-password" });

  const plain = randomToken();
  const tokenHash = hashToken(plain);

  await VerificationToken.create({
    user: userId,
    tokenHash,
    action: "reset-password",
    expires_at,
  });

  return { plainToken: plain, expires_at };
}

export async function consumePasswordResetToken(plainToken) {
  if (!plainToken || typeof plainToken !== "string") {
    throw new ApiError(400, "Token is required");
  }

  const tokenHash = hashToken(plainToken.trim());
  const record = await VerificationToken.findOne({
    tokenHash,
    action: "reset-password",
  }).populate("user");

  if (!record || !record.user) {
    throw new ApiError(400, "Invalid or expired reset link");
  }

  if (new Date(record.expires_at).getTime() < Date.now()) {
    await VerificationToken.deleteOne({ _id: record._id });
    throw new ApiError(400, "Reset link has expired. Please request a new one.");
  }

  return record; // caller sets new password then calls deleteOne
}
