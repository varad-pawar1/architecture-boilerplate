import nodemailer from "nodemailer";

let cachedSmtpTransport;
let etherealTransportPromise;

async function createEtherealTransport() {
  const testAccount = await nodemailer.createTestAccount();
  console.log(
    "\n\x1b[36m[email:ethereal]\x1b[0m Test inbox — open the preview URL printed after each send, or log in at https://ethereal.email with:\n" +
      `  User: ${testAccount.user}\n` +
      `  Pass: ${testAccount.pass}\n`
  );
  return nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
}

function smtpUser() {
  return (process.env.SMTP_USER || process.env.EMAIL_USER)?.trim();
}

function smtpPass() {
  const raw = process.env.SMTP_PASS || process.env.EMAIL_PASS;
  if (raw == null) return undefined;
  // Gmail app passwords are often shown with spaces; nodemailer accepts them with or without.
  return String(raw).replace(/\s+/g, "").trim() || undefined;
}

/**
 * Resolves the mail transport:
 * - If `SMTP_HOST` is set → your real SMTP (Gmail, SendGrid, etc.).
 * - Else in development (or if `USE_ETHEREAL=true`) → Ethereal fake SMTP so messages appear in a web preview (no DNS/real inbox needed).
 * - Else → no transport (worker logs payload only).
 *
 * Credentials: `SMTP_USER` / `SMTP_PASS`, or aliases `EMAIL_USER` / `EMAIL_PASS`.
 */
export async function resolveMailTransport() {
  const host = process.env.SMTP_HOST?.trim();
  if (host) {
    if (!cachedSmtpTransport) {
      const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
      const user = smtpUser();
      const pass = smtpPass();
      cachedSmtpTransport = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: user && pass ? { user, pass } : undefined,
      });
      console.log(`\x1b[32m[email]\x1b[0m Using SMTP host ${host}:${port}\n`);
    }
    return { transport: cachedSmtpTransport, mode: "smtp" };
  }

  const useEthereal =
    process.env.USE_ETHEREAL === "true" ||
    (process.env.USE_ETHEREAL !== "false" && process.env.NODE_ENV === "development");

  if (useEthereal) {
    if (!etherealTransportPromise) {
      etherealTransportPromise = createEtherealTransport();
    }
    const transport = await etherealTransportPromise;
    return { transport, mode: "ethereal" };
  }

  return { transport: null, mode: "none" };
}

export function getDefaultFrom() {
  return process.env.EMAIL_FROM || smtpUser() || "noreply@localhost";
}
