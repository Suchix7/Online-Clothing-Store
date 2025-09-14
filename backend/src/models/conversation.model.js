// models/conversation.model.js
import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    userName: { type: String, default: "" },

    lastMessage: { type: String, default: "" },
    lastFrom: { type: String, enum: ["user", "admin"], default: "user" },

    // Unread counters
    // unreadForAdmin: { type: Number, default: 0 },
    // unreadForUser: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Ensure we can quickly find by either registered or guest identity
conversationSchema.index({ userId: 1 }, { sparse: true });
// Admin list needs “recent first”
conversationSchema.index({ updatedAt: -1 });

export default mongoose.model("Conversation", conversationSchema);
