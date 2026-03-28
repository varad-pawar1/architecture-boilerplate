import UserSession from "../../../models/userSession.model.js";
import moment from "moment";
import redisClient from "../../../config/redis-connect.js";
import { v4 as uuidv4 } from "uuid";

function userAgentFromRequest(userAgentHeader) {
  const ua = typeof userAgentHeader === "string" ? userAgentHeader : "";
  return {
    version: "",
    os: "",
    platform: "",
    source: ua.slice(0, 512),
  };
}

const setSession = async ({ user, ip, user_agent }) => {
  const sessionId = uuidv4();
  const sessionkey = "__usersession_" + sessionId;
  const userkey = "__sessions_" + user._id;
  let user_sessions = await redisClient.get(userkey);
  const ACCESS_EXPIRATION_MINUTES = process.env.ACCESS_EXPIRATION_MINUTES;
  if (!ACCESS_EXPIRATION_MINUTES) {
    throw new Error("ACCESS_EXPIRATION_MINUTES is not set");
  }
  const expirationInSeconds = parseInt(ACCESS_EXPIRATION_MINUTES, 10) * 60;
  const expiresAt = moment().add(parseInt(ACCESS_EXPIRATION_MINUTES, 10), "minutes");

  const ua =
    typeof user_agent === "string"
      ? userAgentFromRequest(user_agent)
      : user_agent || userAgentFromRequest("");

  user_sessions && (user_sessions = JSON.parse(user_sessions));
  !user_sessions && (user_sessions = []);
  const activeSessionLoc = "ACTIVE";

  const sessionPayLoad = {
    userId: user._id,
    companyId: user.company ?? null,
    expiresAt,
    ip,
    status: activeSessionLoc,
  };

  await redisClient.set(sessionkey, JSON.stringify(sessionPayLoad), "EX", expirationInSeconds);
  user_sessions.push(sessionId);
  await redisClient.set(userkey, JSON.stringify(user_sessions), "EX", expirationInSeconds);

  await UserSession.create({
    user_agent: ua,
    ip,
    status: "ACTIVE",
    sessionId,
    user: user._id,
    expiresAt,
  });

  return sessionId;
};

const getSession = async (sessionId) => {
  const sessionKey = "__usersession_" + sessionId;
  let session = await redisClient.get(sessionKey);
  if (session) session = JSON.parse(session);
  return session;
};

const markSessionInactive = async (sessions) => {
  if (!sessions || !Array.isArray(sessions) || sessions.length === 0) return;
  await UserSession.updateMany(
    { sessionId: { $in: sessions } },
    { $set: { status: "INACTIVE", expiresAt: new Date() } }
  );
};

const destroySession = async (sessionId) => {
  const delSessionKey = "__usersession_" + sessionId;
  let deletedSession = await redisClient.get(delSessionKey);
  if (deletedSession) {
    deletedSession = JSON.parse(deletedSession);
    await redisClient.del(delSessionKey);
    const userkey = "__sessions_" + deletedSession?.userId;
    const ttl = await redisClient.ttl(userkey);
    let user_sessions = await redisClient.get(userkey);
    if (user_sessions) {
      user_sessions = JSON.parse(user_sessions);
      const sessionIndex = user_sessions.findIndex((res) => res === sessionId);
      if (sessionIndex !== -1) {
        const removed = user_sessions.splice(sessionIndex, 1);
        await redisClient.set(userkey, JSON.stringify(user_sessions), "EX", ttl > 0 ? ttl : 300);
        await markSessionInactive(removed);
      }
    }
  }
};

const destroyAllSessions = async (userId) => {
  const userkey = "__sessions_" + userId;
  let user_sessions = await redisClient.get(userkey);
  if (user_sessions) {
    user_sessions = JSON.parse(user_sessions);
    for (const sid of user_sessions) {
      await redisClient.del("__usersession_" + sid);
    }
    await redisClient.set(userkey, "", "EX", 300000);
    await markSessionInactive(user_sessions);
  }
};

const isStorageActive = () => redisClient.status;

export default {
  setSession,
  getSession,
  destroySession,
  destroyAllSessions,
  isStorageActive,
};
