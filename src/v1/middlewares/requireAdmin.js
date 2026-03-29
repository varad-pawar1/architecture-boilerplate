import { User } from "../../models/user.model.js";

export default async function requireAdmin(req, res, next) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({
        success: false,
        error: { code: "UNAUTHORIZED", message: "Authentication required" },
      });
    }
    const user = await User.findById(req.user.userId).select("role");
    if (!user || user.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: { code: "FORBIDDEN", message: "Admin access required" },
      });
    }
    next();
  } catch (e) {
    next(e);
  }
}
