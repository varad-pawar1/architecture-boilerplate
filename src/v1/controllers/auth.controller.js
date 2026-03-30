import * as authService from "../services/auth/auth.service.js";
import sessionService from "../services/auth/session.service.js";
import * as verificationService from "../services/auth/verification.service.js";
import { queueTemplateEmail } from "../services/email/emailQueue.service.js";
import { User } from "../../models/user.model.js";
import { getCookieName, setCookiOptions } from "../../config/constants/cookieConfig.js";
import ApiError from "../../utils/apiError.js";

function logoutCookieOpts() {
  return { ...setCookiOptions, maxAge: 0 };
}

function cookieOptsForRequest(req) {
  const origin = req.get("origin");
  const opts = { ...setCookiOptions };
  if (origin) {
    try {
      const { hostname } = new URL(origin);
      if (hostname === "localhost" || hostname === "127.0.0.1") {
        opts.sameSite = "none";
      }
    } catch {
      // Malformed origin — leave defaults
    }
  }
  return opts;
}

function userToJSON(user) {
  const o = user.toObject ? user.toObject() : { ...user };
  delete o.password;
  return o;
}

function publicApiBase(req) {
  return (
    process.env.PUBLIC_API_URL?.replace(/\/$/, "") ||
    `${req.protocol}://${req.get("host")}`
  );
}

function appName() {
  return process.env.APP_NAME || "Application";
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

    const { plainToken } = await verificationService.issueEmailVerificationToken(user._id);
    const base = publicApiBase(req);
    const verifyUrl = `${base}/v1/auth/verify-email?token=${encodeURIComponent(plainToken)}`;

    await queueTemplateEmail({
      to: user.email,
      templateSlug: "verify-email",
      variables: {
        name: user.name,
        verifyUrl,
        appName: appName(),
      },
    });

    res.status(201).json({
      message: "Account created. Check your email to verify before signing in.",
      data: { user: userToJSON(user) },
    });
  } catch (error) {
    next(error);
  }
}

export async function verifyEmail(req, res, next) {
  try {
    const token = req.query.token;
    const user = await verificationService.consumeEmailVerificationToken(token);

    const base = publicApiBase(req);
    const web = process.env.WEB_APP_URL?.replace(/\/$/, "");
    const loginUrl = web ? `${web}/login` : `${base}/v1/auth`;

    await queueTemplateEmail({
      to: user.email,
      templateSlug: "email-verified",
      variables: {
        name: user.name,
        loginUrl,
        appName: appName(),
      },
    });

    if (req.query.redirect === "1" && process.env.WEB_APP_URL) {
      return res.redirect(302, `${process.env.WEB_APP_URL.replace(/\/$/, "")}/login?verified=1`);
    }

    res.status(200).json({
      success: true,
      message: "Email verified successfully. You can sign in now.",
      data: { user: userToJSON(user) },
    });
  } catch (error) {
    next(error);
  }
}

export async function resendVerification(req, res, next) {
  try {
    const { email } = req.body;
    if (!email) throw new ApiError(400, "Email is required");

    const user = await User.findOne({ email: String(email).toLowerCase().trim() });
    if (!user || user.isEmailVerified) {
      // Always same response to prevent email enumeration
      return res.status(200).json({
        success: true,
        message: "If an account exists, a verification email has been sent.",
      });
    }

    const { plainToken } = await verificationService.issueEmailVerificationToken(user._id);
    const base = publicApiBase(req);
    const verifyUrl = `${base}/v1/auth/verify-email?token=${encodeURIComponent(plainToken)}`;

    await queueTemplateEmail({
      to: user.email,
      templateSlug: "verify-email",
      variables: {
        name: user.name,
        verifyUrl,
        appName: appName(),
      },
    });

    res.status(200).json({
      success: true,
      message: "If an account exists, a verification email has been sent.",
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
    res.status(200).json({ message: "Logged out" });
  } catch (error) {
    next(error);
  }
}

export async function googleLogin(req, res, next) {
  try {
    const { idToken } = req.body;
    if (!idToken) throw new ApiError(400, "idToken is required");

    const googleProfile = await authService.verifyGoogleToken(idToken);
    const user = await authService.findOrCreateGoogleUser(googleProfile);

    const session_id = await sessionService.setSession({
      user,
      ip: req.header("x-forwarded-for") || req.socket?.remoteAddress,
      user_agent: req.get("user-agent"),
    });

    const sessionCookieName = getCookieName();
    res.cookie(sessionCookieName, session_id, cookieOptsForRequest(req));

    res.status(200).json({
      message: "Google login successful",
      data: { user: userToJSON(user) },
    });
  } catch (error) {
    next(error);
  }
}

export async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    if (!email) throw new ApiError(400, "Email is required");

    const user = await User.findOne({ email: String(email).toLowerCase().trim() });

    if (!user || !user.isEmailVerified) {
      return res.status(200).json({
        success: true,
        message: "If an account exists, a password reset link has been sent.",
      });
    }

    const { plainToken } = await verificationService.issuePasswordResetToken(user._id);
    const web = process.env.WEB_APP_URL?.replace(/\/$/, "");
    const base = publicApiBase(req);
    const resetUrl = web
      ? `${web}/reset-password?token=${encodeURIComponent(plainToken)}`
      : `${base}/v1/auth/reset-password?token=${encodeURIComponent(plainToken)}`;

    await queueTemplateEmail({
      to: user.email,
      templateSlug: "forgot-password",
      variables: {
        name: user.name,
        resetUrl,
        appName: appName(),
        expiresIn: process.env.RESET_PASSWORD_EXPIRATION_MINUTES || "60",
      },
    });

    res.status(200).json({
      success: true,
      message: "If an account exists, a password reset link has been sent.",
    });
  } catch (error) {
    next(error);
  }
}

export async function resetPassword(req, res, next) {
  try {
    const token = req.body?.token || req.query?.token;
    const { password } = req.body;
    if (!token || !password) throw new ApiError(400, "Token and new password are required");
    if (password.length < 8) throw new ApiError(400, "Password must be at least 8 characters");

    const record = await verificationService.consumePasswordResetToken(token);
    await authService.resetPassword(record.user._id, password);
    await verificationService.VerificationToken.deleteOne({ _id: record._id });

    await sessionService.destroyAllSessions(record.user._id);

    await queueTemplateEmail({
      to: record.user.email,
      templateSlug: "password-reset-success",
      variables: {
        name: record.user.name,
        appName: appName(),
      },
    });

    res.status(200).json({
      success: true,
      message: "Password reset successfully. You can now sign in with your new password.",
    });
  } catch (error) {
    next(error);
  }
}