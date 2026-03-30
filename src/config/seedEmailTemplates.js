import { EmailTemplate } from "../models/emailTemplate.model.js";

const defaults = [
  {
    slug: "verify-email",
    name: "Verify email (registration)",
    description: "Sent after signup; contains verification link.",
    subject: "Verify your email — {{appName}}",
    variableHints: ["name", "verifyUrl", "appName"],
    htmlBody: `<!DOCTYPE html>
<html><body style="font-family:system-ui,sans-serif;line-height:1.5">
  <p>Hi {{name}},</p>
  <p>Thanks for registering. Please verify your email by clicking the link below:</p>
  <p><a href="{{verifyUrl}}">Verify my email</a></p>
  <p>If you did not create an account, you can ignore this message.</p>
  <p>— {{appName}}</p>
</body></html>`,
    textBody:
      "Hi {{name}},\n\nVerify your email: {{verifyUrl}}\n\n— {{appName}}",
  },
  {
    slug: "email-verified",
    name: "Email verified (success)",
    description: "Sent after the user successfully verifies their email.",
    subject: "Your email is verified — {{appName}}",
    variableHints: ["name", "loginUrl", "appName"],
    htmlBody: `<!DOCTYPE html>
<html><body style="font-family:system-ui,sans-serif;line-height:1.5">
  <p>Hi {{name}},</p>
  <p>Your email address is now verified. You can sign in anytime:</p>
  <p><a href="{{loginUrl}}">Go to login</a></p>
  <p>— {{appName}}</p>
</body></html>`,
    textBody:
      "Hi {{name}},\n\nYour email is verified. Sign in: {{loginUrl}}\n\n— {{appName}}",
  },
  {
    slug: "forgot-password",
    name: "Forgot password",
    description: "Sent when user requests password reset.",
    subject: "Reset your password — {{appName}}",
    variableHints: ["name", "resetUrl", "expiresIn", "appName"],
    htmlBody: `<!DOCTYPE html>
<html><body style="font-family:system-ui,sans-serif;line-height:1.5">
  <p>Hi {{name}},</p>
  <p>We received a request to reset your password.</p>
  <p><a href="{{resetUrl}}">Reset password</a></p>
  <p>This link expires in {{expiresIn}} minutes.</p>
  <p>If you did not request this, you can ignore this email.</p>
  <p>— {{appName}}</p>
</body></html>`,
    textBody:
      "Hi {{name}},\n\nReset your password: {{resetUrl}}\nThis link expires in {{expiresIn}} minutes.\n\n— {{appName}}",
  },
  {
    slug: "password-reset-success",
    name: "Password reset success",
    description: "Sent after user has successfully reset password.",
    subject: "Password changed successfully — {{appName}}",
    variableHints: ["name", "appName"],
    htmlBody: `<!DOCTYPE html>
<html><body style="font-family:system-ui,sans-serif;line-height:1.5">
  <p>Hi {{name}},</p>
  <p>Your password was changed successfully.</p>
  <p>If this was not you, contact support immediately.</p>
  <p>— {{appName}}</p>
</body></html>`,
    textBody:
      "Hi {{name}},\n\nYour password was changed successfully.\nIf this was not you, contact support immediately.\n\n— {{appName}}",
  },
];

/**
 * Idempotent seed: creates missing templates by slug; does not overwrite custom edits.
 */
export async function seedEmailTemplates() {
  for (const doc of defaults) {
    const exists = await EmailTemplate.findOne({ slug: doc.slug });
    if (!exists) {
      await EmailTemplate.create(doc);
      console.log(`[seed] Email template created: ${doc.slug}`);
    }
  }
}
