// lib/chatStore.js
import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import mongoose from "mongoose";

/**
 * Create or get a conversation for a registered user.
 * Guests are not persisted (no userId => throw).
 */
export async function upsertConversation({ userId, userName }) {
  if (!userId) {
    throw new Error(
      "Cannot upsert conversation without userId (guests not persisted)."
    );
  }

  const query = { userId };
  const update = {
    ...(userName ? { userName } : {}),
    $setOnInsert: { userId },
  };
  const opts = { upsert: true, new: true, setDefaultsOnInsert: true };
  return Conversation.findOneAndUpdate(query, update, opts);
}

/**
 * Persist a message for registered users only.
 * If userId is missing (guest), we skip DB writes and return { persisted:false }.
 *
 * @returns { persisted: boolean, convo?, msg? }
 */
export async function addMessage({
  userId,
  userName,
  from,
  text = "",
  attachments = [],
  clientId = null,
}) {
  // 🚫 Skip persistence entirely for guests to push
  if (!userId) return { persisted: false, reason: "guest-not-persisted" };

  // Validate: must have text or at least one attachment
  const hasText = typeof text === "string" && text.trim().length > 0;
  const hasAttachment = Array.isArray(attachments) && attachments.length > 0;
  if (!hasText && !hasAttachment) {
    return { persisted: false, reason: "empty-message" };
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const convo = await upsertConversation({ userId, userName });

    const now = new Date();
    const msg = await Message.create(
      [
        {
          conversationId: convo._id,
          sender: {
            role: from === "admin" ? "admin" : "user",
            userId, // only registered users persisted in your design
          },
          text: hasText ? text : "",
          attachments: hasAttachment ? attachments : [],
          clientId,
          status: "sent",
          ts: now,
        },
      ],
      { session }
    ).then((r) => r[0]);

    // Conversation preview (caption if provided, else "[image]" for image-only)
    const preview = hasText ? text : hasAttachment ? "[image]" : "";

    await Conversation.updateOne(
      { _id: convo._id },
      {
        lastMessage: preview,
        lastFrom: from,
        updatedAt: now,
      },
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    return { persisted: true, convo, msg };
  } catch (e) {
    await session.abortTransaction();
    session.endSession();
    throw e;
  }
}

/**
 * markRead becomes a no-op because unread counters were removed.
 * Keep it for API compatibility (e.g., callers can still await it safely).
 */
export async function markRead() {
  return null;
}
