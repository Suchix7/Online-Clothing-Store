import express from "express";
import {
  login,
  logout,
  signup,
  checkAuth,
  changePassword,
  updateUserData,
  googleLogin,
} from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/signup", signup);

router.post("/login", login);

router.get("/logout", logout);

router.get("/check", protectRoute, checkAuth);

router.post("/change-password", changePassword);

router.post("/update-user", updateUserData);

router.post("/google-login", googleLogin);

export default router;
