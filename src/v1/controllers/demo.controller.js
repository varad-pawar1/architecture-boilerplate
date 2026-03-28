import { addDemoJob } from "../../config/scheduling.js";

export async function enqueueDemo(req, res, next) {
  try {
    await addDemoJob({ userId: req.user.userId, note: req.body?.note || "hello from boilerplate" });
    res.status(202).json({
      success: true,
      message: "Demo job queued — check server logs for worker output",
    });
  } catch (e) {
    next(e);
  }
}
