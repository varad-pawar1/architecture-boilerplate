import express from "express";
import * as authController from "../controllers/auth.controller.js";
import authHandle from "../middlewares/authHandle.js";

const router = express.Router();

router.get("/", (req, res) => {
  return res.status(200).json({ success: true, message: "Auth#index" });
});

router.post("/login", authController.loginUser);
router.post("/register", authController.registerUser);
router.get("/logout", authController.logout);
router.get("/me", authHandle, authController.autoLogin);

export default router;
