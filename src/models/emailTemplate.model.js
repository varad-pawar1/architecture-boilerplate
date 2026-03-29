import mongoose from "mongoose";

const EmailTemplateSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    name: { type: String, required: true },
    description: { type: String, default: "" },
    subject: { type: String, required: true },
    htmlBody: { type: String, required: true },
    textBody: { type: String, default: "" },
    /** Documented placeholders, e.g. ["name", "verifyUrl"] — used for admin UI hints only */
    variableHints: [{ type: String }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const EmailTemplate = mongoose.model("emailTemplate", EmailTemplateSchema);
