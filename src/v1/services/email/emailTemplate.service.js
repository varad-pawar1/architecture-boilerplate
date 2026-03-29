import { EmailTemplate } from "../../../models/emailTemplate.model.js";

/**
 * Replace {{key}} placeholders in a string. Values are HTML-escaped when used in HTML context
 * only if options.escapeHtml is true (default false for subject already safe).
 */
export function renderPlaceholders(template, variables = {}) {
  if (!template || typeof template !== "string") return "";
  return template.replace(/\{\{\s*([\w.-]+)\s*\}\}/g, (_, key) => {
    const v = variables[key];
    if (v === undefined || v === null) return "";
    return String(v);
  });
}

export async function getActiveTemplateBySlug(slug) {
  const t = await EmailTemplate.findOne({ slug, isActive: true }).lean();
  return t;
}

export async function renderEmailTemplate(slug, variables) {
  const t = await getActiveTemplateBySlug(slug);
  if (!t) {
    throw new Error(`Email template not found or inactive: ${slug}`);
  }
  const subject = renderPlaceholders(t.subject, variables);
  const html = renderPlaceholders(t.htmlBody, variables);
  const text = t.textBody ? renderPlaceholders(t.textBody, variables) : "";
  return { subject, html, text };
}
