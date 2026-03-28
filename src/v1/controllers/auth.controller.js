import * as authService from "../services/auth/auth.service.js";
import sessionService from "../services/auth/session.service.js";
import { User } from "../../models/user.model.js";
import { getCookieName, setCookiOptions } from "../../config/constants/cookieConfig.js";
import url from "node:url";

function logoutCookieOpts() {
  return { ...setCookiOptions, maxAge: 0 };
}

function cookieOptsForRequest(req) {
  const origin = req.get("origin");
  const opts = { ...setCookiOptions };
  if (origin && url.parse(origin).hostname === "localhost") {
    opts.sameSite = "none";
  }
  return opts;
}

function userToJSON(user) {
  const o = user.toObject ? user.toObject() : { ...user };
  delete o.password;
  return o;
}

export async function loginUser(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await authService.verifyPassword(email, password);

    const session_id = await sessionService.setSession({
      user,
      ip: req.header("x-forwarded-for") || req.socket?.remoteAddress,
      user_agent: req.get("user-agent"),
    });
    const sessionCookieName = getCookieName();
    res.cookie(sessionCookieName, session_id, cookieOptsForRequest(req));

    res.status(200).json({
      message: "Login successful",
      data: { user: userToJSON(user) },
    });
  } catch (error) {
    next(error);
  }
}

export async function registerUser(req, res, next) {
  try {
    const { name, email, password } = req.body;
    const user = await authService.registerUser(
      name || email.split("@")[0],
      email,
      password,
      "user"
    );

    const session_id = await sessionService.setSession({
      user,
      ip: req.header("x-forwarded-for") || req.socket?.remoteAddress,
      user_agent: req.get("user-agent"),
    });
    const sessionCookieName = getCookieName();
    res.cookie(sessionCookieName, session_id, cookieOptsForRequest(req));
    res.status(200).json({
      message: "Registered successfully",
      data: { user: userToJSON(user) },
    });
  } catch (error) {
    next(error);
  }
}

export async function autoLogin(req, res, next) {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: "USER_NOT_FOUND", message: "User not found" },
      });
    }
    res.status(200).json({
      message: "Session valid",
      data: { user: userToJSON(user) },
    });
  } catch (error) {
    next(error);
  }
}

export async function logout(req, res, next) {
  try {
    const sessionCookieName = getCookieName();
    const sessionToken = req.cookies[sessionCookieName];
    res.cookie(sessionCookieName, "", logoutCookieOpts());
    if (sessionToken) {
      await sessionService.destroySession(sessionToken);
    }
    res.status(200).json({
      message: "Logged out",
    });
  } catch (error) {
    next(error);
  }
}
