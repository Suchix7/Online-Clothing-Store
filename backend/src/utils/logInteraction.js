import Interaction from "../models/interaction.model.js";
import mongoose from "mongoose";

export async function logInteraction({
  userId,
  productId,
  type,
  weight = 1,
  meta = {},
}) {
  try {
    if (!userId || !productId) return;
    const uid = new mongoose.Types.ObjectId(userId);
    const pid = new mongoose.Types.ObjectId(productId);

    // de-dupe: max 1 event per user/product/type per day (keeps DB tidy)
    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);

    await Interaction.updateOne(
      { userId: uid, productId: pid, type, ts: { $gte: dayStart } },
      { $setOnInsert: { ts: new Date(), weight, meta } },
      { upsert: true }
    );
  } catch (e) {
    console.error("logInteraction failed:", e.message);
  }
}
