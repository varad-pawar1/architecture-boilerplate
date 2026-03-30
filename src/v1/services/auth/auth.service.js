import { User } from "../../../models/user.model.js";
import ApiError from "../../../utils/apiError.js";
import { OAuth2Client } from "google-auth-library";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export async function verifyGoogleToken(idToken) {
  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload();
  if (!payload?.email_verified) {
    throw new ApiError(401, "Google account email is not verified");
  }
  return {
    email: payload.email,
    name: payload.name || payload.email.split("@")[0],
    googleId: payload.sub,
  };
}

export async function findOrCreateGoogleUser(googleProfile) {
  const { email, name, googleId } = googleProfile;

  let user = await User.findOne({ email });

  if (user) {
    // Link Google ID if not already linked
    if (!user.googleId) {
      user.googleId = googleId;
      user.isEmailVerified = true; // Google already verified the email
      await user.save();
    }
    return user;
  }

  // New user via Google — no password needed
  user = await User.create({
    name,
    email,
    googleId,
    isEmailVerified: true,
    role: "user",
    // password field left empty; guard this in your login flow
  });

  return user;
}

export async function resetPassword(userId, newPassword) {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User not found");
  user.password = newPassword; // let your model's pre-save hook hash it
  await user.save();
  return user;
}
export async function verifyPassword(email, password) {
  const userData = await User.findOne({ email });
  if (!userData) throw new ApiError(401, "User not found");
  const passMatch = await userData.isPasswordMatch(password);
  if (!passMatch) {
    throw new ApiError(401, "Incorrect credentials");
  }
  if (!userData.isEmailVerified) {
    throw new ApiError(403, "Please verify your email before signing in", "EMAIL_NOT_VERIFIED");
  }
  return userData;
}

export async function registerUser(name, email, password, role = "user") {
  const existing = await User.findOne({ email });
  if (existing) {
    throw new ApiError(401, "Email already taken");
  }
  const displayName = name || email.split("@")[0].replace(/[._-]/g, " ");
  const user = await User.create({
    name: displayName,
    email,
    password,
    role,
  });
  return user;
}
