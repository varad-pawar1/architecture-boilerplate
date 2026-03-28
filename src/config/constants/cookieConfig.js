const secureCookie =
  process.env.COOKIE_SECURE === "true" ||
  (process.env.COOKIE_SECURE !== "false" && process.env.NODE_ENV !== "development");

const cookieOptions = {
  sameSite: "lax",
  httpOnly: true,
  secure: secureCookie,
  maxAge: process.env.ACCESS_EXPIRATION_MINUTES
    ? parseInt(process.env.ACCESS_EXPIRATION_MINUTES, 10) * 60 * 1000
    : 0,
  path: "/",
};

const cookieOptionsStaging = {
  ...cookieOptions,
  sameSite: process.env.NODE_ENV === "development" ? "lax" : "none",
};

const getCookieName = () => {
  return process.env.NODE_ENV === "development" || process.env.NODE_ENV === "staging"
    ? "x-auth-token"
    : "__Host-session";
};

const setCookiOptions = {
  ...(process.env.NODE_ENV === "development" || process.env.NODE_ENV === "staging"
    ? cookieOptionsStaging
    : cookieOptions),
};

export { getCookieName, setCookiOptions };
