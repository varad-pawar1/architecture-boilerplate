import nodemailer from "nodemailer";
import { resolveMailTransport, getDefaultFrom } from "./email.transport.js";
import { renderEmailTemplate } from "./emailTemplate.service.js";

/**
 * BullMQ worker handler: loads template from DB, renders variables, sends via SMTP or Ethereal.
 */
export async function processSendEmailJob(job) {
  const { to, templateSlug, variables = {}, subjectOverride } = job.data || {};

  if (!to || !templateSlug) {
    throw new Error("send-email job requires `to` and `templateSlug`");
  }

  const rendered = await renderEmailTemplate(templateSlug, variables);
  const subject = subjectOverride || rendered.subject;
  const from = getDefaultFrom();

  const { transport, mode } = await resolveMailTransport();

  if (!transport) {
    console.log(
      "\n\x1b[33m[email]\x1b[0m No mail transport — set SMTP_* in .env, or use Ethereal in dev (see .env.example).\n" +
        "  Would send verification to:",
      to,
      "\n  Subject:",
      subject,
      "\n  Link preview in HTML:",
      rendered.html.match(/href="([^"]+)"/)?.[1] || "(no link)",
      "\n"
    );
    return { skipped: true, reason: "no_transport", to, subject };
  }

  const info = await transport.sendMail({
    from,
    to,
    subject,
    text: rendered.text || undefined,
    html: rendered.html,
  });

  if (mode === "ethereal") {
    const previewUrl = nodemailer.getTestMessageUrl(info);
    console.log(
      `\n\x1b[32m[email]\x1b[0m Message sent (Ethereal). \x1b[36mOpen this URL to read the email:\x1b[0m\n  ${previewUrl}\n`
    );
  } else {
    console.log(`\x1b[32m[email]\x1b[0m Sent OK messageId=${info.messageId} to=${to}`);
  }

  return { messageId: info.messageId, to, subject, mode };
}
