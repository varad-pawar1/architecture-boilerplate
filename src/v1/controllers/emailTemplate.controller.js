import { EmailTemplate } from "../../models/emailTemplate.model.js";
import ApiError from "../../utils/apiError.js";

export async function listTemplates(req, res, next) {
  try {
    const items = await EmailTemplate.find().sort({ slug: 1 }).lean();
    res.json({ success: true, data: items });
  } catch (e) {
    next(e);
  }
}

export async function getTemplate(req, res, next) {
  try {
    const t = await EmailTemplate.findOne({ slug: req.params.slug }).lean();
    if (!t) throw new ApiError(404, "Template not found");
    res.json({ success: true, data: t });
  } catch (e) {
    next(e);
  }
}

export async function createTemplate(req, res, next) {
  try {
    const { slug, name, description, subject, htmlBody, textBody, variableHints, isActive } =
      req.body;
    if (!slug || !name || !subject || !htmlBody) {
      throw new ApiError(400, "slug, name, subject, and htmlBody are required");
    }
    const exists = await EmailTemplate.findOne({ slug: String(slug).toLowerCase() });
    if (exists) throw new ApiError(409, "Template slug already exists");
    const doc = await EmailTemplate.create({
      slug: String(slug).toLowerCase().trim(),
      name,
      description: description || "",
      subject,
      htmlBody,
      textBody: textBody || "",
      variableHints: Array.isArray(variableHints) ? variableHints : [],
      isActive: isActive !== false,
    });
    res.status(201).json({ success: true, data: doc });
  } catch (e) {
    next(e);
  }
}

export async function updateTemplate(req, res, next) {
  try {
    const t = await EmailTemplate.findOne({ slug: req.params.slug });
    if (!t) throw new ApiError(404, "Template not found");
    const { name, description, subject, htmlBody, textBody, variableHints, isActive } = req.body;
    if (name !== undefined) t.name = name;
    if (description !== undefined) t.description = description;
    if (subject !== undefined) t.subject = subject;
    if (htmlBody !== undefined) t.htmlBody = htmlBody;
    if (textBody !== undefined) t.textBody = textBody;
    if (variableHints !== undefined) t.variableHints = variableHints;
    if (isActive !== undefined) t.isActive = isActive;
    await t.save();
    res.json({ success: true, data: t });
  } catch (e) {
    next(e);
  }
}

export async function deleteTemplate(req, res, next) {
  try {
    const t = await EmailTemplate.findOneAndDelete({ slug: req.params.slug });
    if (!t) throw new ApiError(404, "Template not found");
    res.json({ success: true, message: "Deleted" });
  } catch (e) {
    next(e);
  }
}
