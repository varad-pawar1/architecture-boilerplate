import express from "express";
import AuthRoute from "./auth.route.js";
import EmailTemplateRoute from "./emailTemplate.route.js";
import * as demoController from "../controllers/demo.controller.js";
import authHandle from "../middlewares/authHandle.js";

const router = express.Router();

router.use("/auth", AuthRoute);
router.use("/email-templates", EmailTemplateRoute);

router.get("/health", (req, res) => {
  res.json({ ok: true, service: "mvc-architecture-boilerplate" });
});

router.post("/queue/demo", authHandle, demoController.enqueueDemo);

export default router;
