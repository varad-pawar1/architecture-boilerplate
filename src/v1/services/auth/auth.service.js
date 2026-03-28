import { User } from "../../../models/user.model.js";
import ApiError from "../../../utils/apiError.js";

export async function verifyPassword(email, password) {
  const userData = await User.findOne({ email });
  if (!userData) throw new ApiError(401, "User not found");
  const passMatch = await userData.isPasswordMatch(password);
  if (!passMatch) {
    throw new ApiError(401, "Incorrect credentials");
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
