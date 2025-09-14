// routes/chat.route.js
import { Router } from "express";
import mongoose from "mongoose";
import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import { uploadImages } from "../utils/upload.utils.js";
import multer from "multer";
import path from "path";

const router = Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // temporary folder
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  // Allow images and videos
  if (
    file.mimetype.startsWith("image/") ||
    file.mimetype.startsWith("video/")
  ) {
    cb(null, true);
  } else {
    cb(new Error("Unsupported file type"), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB size limit
  },
  fileFilter: fileFilter,
});

/**
 * GET /api/chat/messages?userId=<mongoId>&limit=50&before=<ISO date>
 * - Only for registered users (guests not persisted)
 * - Returns newest-last (chronological) messages
 */
router.get("/messages", async (req, res) => {
  try {
    const { userId, limit = 10, before } = req.query;

    // Validate userId (required)
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid or missing userId" });
    }

    // Coerce and clamp limit
    const take = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100);

    // Find conversation for this registered user
    const convo = await Conversation.findOne({ userId });
    if (!convo) {
      return res.json([]); // no conversation yet
    }

    // Build message query
    const q = { conversationId: convo._id };
    if (before) {
      const beforeDate = new Date(before);
      if (!isNaN(beforeDate.getTime())) {
        q.ts = { $lt: beforeDate };
      }
    }

    // Pull newest first, then reverse to chronological
    const rows = await Message.find(q)
      .sort({ ts: -1, _id: -1 })
      .limit(take)
      .lean();

    const result = rows.reverse(); // chronological (oldest -> newest)
    return res.json(result);
  } catch (err) {
    console.error("GET /api/chat/messages error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/conversations", async (req, res) => {
  try {
    const { limit = 50, before, q } = req.query;

    const take = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 200);

    const filter = {};
    if (before) {
      const d = new Date(before);
      if (!isNaN(d.getTime())) {
        filter.updatedAt = { $lt: d };
      }
    }

    if (q && String(q).trim()) {
      const term = String(q).trim();
      // Search by userName or string form of userId
      filter.$or = [
        { userName: { $regex: term, $options: "i" } },
        // Note: userId is an ObjectId; this helps when admins paste an id
        {
          userId: mongoose.Types.ObjectId.isValid(term)
            ? new mongoose.Types.ObjectId(term)
            : null,
        },
      ];
    }

    // Remove the null condition inserted when term isn't a valid ObjectId
    if (filter.$or) {
      filter.$or = filter.$or.filter(
        (clause) => clause.userName || clause.userId
      );
    }

    const rows = await Conversation.find(filter)
      .select({
        userId: 1,
        userName: 1,
        lastMessage: 1,
        lastFrom: 1,
        updatedAt: 1,
      })
      .sort({ updatedAt: -1 })
      .limit(take)
      .lean();

    // Normalize payload to what your admin JS expects
    const result = rows.map((c) => ({
      userId: String(c.userId),
      userName: c.userName || "",
      lastMessage: c.lastMessage || "",
      lastFrom: c.lastFrom || "user",
      updatedAt: c.updatedAt,
    }));

    return res.json(result);
  } catch (err) {
    console.error("GET /api/chat/conversations error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/upload", upload.array("files", 5), async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    // Call your Cloudinary helper
    const results = await uploadImages(req.files, "chat-images");

    // Return the list of uploaded URLs
    res.json({ success: true, userId, images: results });
  } catch (err) {
    console.error("Chat upload error:", err);
    res.status(500).json({ message: "Upload failed", error: err.message });
  }
});

export default router;
