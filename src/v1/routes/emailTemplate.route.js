import express from "express";
import * as ctrl from "../controllers/emailTemplate.controller.js";
import authHandle from "../middlewares/authHandle.js";
import requireAdmin from "../middlewares/requireAdmin.js";

const router = express.Router();

router.use(authHandle, requireAdmin);

router.get("/", ctrl.listTemplates);
router.get("/:slug", ctrl.getTemplate);
router.post("/", ctrl.createTemplate);
router.patch("/:slug", ctrl.updateTemplate);
router.delete("/:slug", ctrl.deleteTemplate);

export default router;
