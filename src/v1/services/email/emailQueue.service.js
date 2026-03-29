import { addEmailJob } from "../../../config/scheduling.js";

/**
 * Enqueues a DB-backed template email on the BullMQ `send-email` job (processed by the same worker process as the API).
 */
export async function queueTemplateEmail({ to, templateSlug, variables, subjectOverride }) {
  return addEmailJob({ to, templateSlug, variables, subjectOverride });
}
