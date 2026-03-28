import { getCookieName, setCookiOptions } from "../../config/constants/cookieConfig.js";
import sessionService from "../services/auth/session.service.js";

export default async function authHandle(req, res, next) {
  const sessionCookieName = getCookieName();
  const authToken = req.cookies[sessionCookieName];

  if (!authToken) {
    return res.status(401).json({
      success: false,
      error: {
        code: "TokenExpirederror",
        message: "Not authenticated — please log in",
      },
    });
  }

  if (!sessionService.isStorageActive || sessionService.isStorageActive() !== "ready") {
    return res.status(503).json({
      success: false,
      error: {
        code: "SERVICE_UNAVAILABLE",
        message: "Session store not ready",
      },
    });
  }

  const session = await sessionService.getSession(authToken);
  const isSessionExist = session && session.status === "ACTIVE";

  if (!isSessionExist) {
    res.cookie(sessionCookieName, authToken, { ...setCookiOptions, maxAge: -1 * 24 * 60 * 60 * 1000 });
    return res.status(401).json({
      success: false,
      error: {
        code: "TokenExpirederror",
        message: "Session expired — please log in again",
      },
    });
  }

  req.user = {
    userId: session.userId,
    companyId: session.companyId,
  };
  next();
}
