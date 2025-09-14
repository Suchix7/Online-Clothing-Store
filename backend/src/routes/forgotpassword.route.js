import express from "express";
import User from "../models/user.model.js";

const router = express.Router();

const VERIFICATION_CODE_EXPIRY = 10 * 60 * 1000;
const generateCode = () =>
  Math.floor(100000 + Math.random() * 900000).toString();
const codeStore = new Map();

router.post("/forgot-password", async (req, res) => {
  const { forgotPasswordEmail } = req.body;

  try {
    const user = await User.findOne({ email: forgotPasswordEmail });

    if (!user) {
      return res
        .status(404)
        .json({ message: "No user found with this email." });
    }

    const code = generateCode();
    const expiresAt = Date.now() + VERIFICATION_CODE_EXPIRY;

    // Store code temporarily
    codeStore.set(forgotPasswordEmail, { code, expiresAt });

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "testproject7828@gmail.com",
        pass: "mcgb qwhr vxqu etmf",
      },
    });

    await transporter.sendMail({
      from: '"Online Clothing Store" <testproject7828@gmail.com>',
      to: forgotPasswordEmail,
      subject: "Your Password Reset Code",
      html: `<p>Your password reset code is: <b>${code}</b></p><p>This code will expire in 10 minutes.</p>`,
    });

    res.status(200).json({ message: "Reset code sent to email." });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ message: "Server error." });
  }
});

router.post("/verify-code", async (req, res) => {
  const { email, code } = req.body;

  const stored = codeStore.get(email);

  if (!stored || stored.code !== code) {
    return res.status(400).json({ message: "Invalid or expired code." });
  }

  if (Date.now() > stored.expiresAt) {
    codeStore.delete(email);
    return res.status(400).json({ message: "Code has expired." });
  }

  // Code is valid, allow password reset
  codeStore.delete(email); // Optionally delete after use
  res
    .status(200)
    .json({ message: "Code verified. You can now reset password." });
});

router.post("/reset-password", async (req, res) => {
  const { email, newPassword } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ message: "User not found" });

    user.password = newPassword;
    await user.save();

    res.status(200).json({ message: "Password reset successful." });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ message: "Server error." });
  }
});

export default router;
