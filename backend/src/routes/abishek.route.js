import express from "express";
import nodemailer from "nodemailer";

const router = express.Router();

router.post("/", async (req, res) => {
  const { name, email, message } = req.body;

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "ab15h3kshrestha@gmail.com",
        pass: "kbiq dfzz adft wrmk", // Your App Password (safe)
      },
    });

    await transporter.sendMail({
      from: `"${name}" <${email}>`, // customer info
      to: "ab15h3kshrestha@gmail.com", // always your Gmail
      subject: `New Contact Us Message from ${name}`,
      text: `
        You received a new message from your website:

        Name: ${name}
        Email: ${email}
        Message: ${message}
      `,
    });

    res.status(200).json({ message: "Email sent successfully" });
  } catch (err) {
    console.error("Error sending email: ", err);
    res.status(500).json({ error: "Failed to send email" });
  }
});

export default router;
