import express from "express";
import * as authController from "../controllers/auth.controller.js";
import authHandle from "../middlewares/authHandle.js";
import { logEmailError } from "../../utils/customErrorLogger.js";

const router = express.Router();

router.get("/", (req, res) => {
  return res.status(200).json({ success: true, message: "Auth#index" });
});

router.get("/me", authHandle, authController.autoLogin);

router.post("/login", authController.loginUser);
router.post("/register", authController.registerUser);
router.post("/google", authController.googleLogin);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);
router.get("/logout", authController.logout);

router.get("/verify-email", authController.verifyEmail);
router.post("/resend-verification", authController.resendVerification);

router.post("/test-email-error", async (req, res) => {
  try {
    throw new Error("Postman Email Error Test");
  } catch (err) {
    await logEmailError(err, {
      to: req.body.to,
      templateSlug: "test-template",
      subject: "Test Subject",
      jobId: "postman-test",
      payload: req.body
    });

    return res.json({
      success: true,
      message: "Email error logged"
    });
  }
});

export default router;
