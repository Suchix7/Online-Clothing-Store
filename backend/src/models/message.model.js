// models/message.model.js
import mongoose from "mongoose";

const { Schema } = mongoose;

const imageAttachmentSchema = new Schema(
  {
    type: { type: String, enum: ["image"], default: "image" }, // future-proof
    url: { type: String, required: true }, // e.g., Cloudinary secure_url
    publicId: { type: String, default: null }, // Cloudinary public_id (optional)
    width: { type: Number, default: null },
    height: { type: Number, default: null },
    bytes: { type: Number, default: null }, // file size in bytes
    mimeType: { type: String, default: null }, // e.g., image/png
    thumbnailUrl: { type: String, default: null }, // if you generate thumbs
  },
  { _id: false }
);

const messageSchema = new Schema(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },

    // Who sent it
    sender: {
      role: { type: String, enum: ["user", "admin"], required: true },
      userId: { type: Schema.Types.ObjectId, ref: "User", default: null }, // present when role === 'user' and registered
    },

    // Text is now optional (can be just an image)
    text: { type: String, default: "" },

    // NEW: attachments (images)
    attachments: {
      type: [imageAttachmentSchema],
      default: [],
    },

    // Optional client-generated id for idempotency / optimistic UI
    clientId: { type: String, default: null },

    // Delivery state (optional but handy)
    status: {
      type: String,
      enum: ["sent", "delivered", "read"],
      default: "sent",
      index: true,
    },

    // Server timestamp (you can also just use createdAt)
    ts: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

// Require at least text or one attachment
messageSchema.pre("validate", function (next) {
  const hasText = this.text && this.text.trim().length > 0;
  const hasAttachment =
    Array.isArray(this.attachments) && this.attachments.length > 0;
  if (!hasText && !hasAttachment) {
    return next(
      new Error("Message must include text or at least one attachment.")
    );
  }
  next();
});

// For fast chronological queries within a conversation
messageSchema.index({ conversationId: 1, ts: 1 });

// Prevent accidental duplicates from retries: same convo + same clientId (when clientId is set)
messageSchema.index(
  { conversationId: 1, clientId: 1 },
  { unique: true, partialFilterExpression: { clientId: { $type: "string" } } }
);

export default mongoose.model("Message", messageSchema);
