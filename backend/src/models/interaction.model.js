// models/Interaction.js
import mongoose from "mongoose";
const interactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, index: true },
  productId: { type: mongoose.Schema.Types.ObjectId, index: true },
  type: {
    type: String,
    enum: ["view", "cart", "purchase", "wishlist"],
    index: true,
  },
  weight: { type: Number, default: 1 },
  ts: { type: Date, default: Date.now, index: true },
  meta: Object,
});
interactionSchema.index(
  { userId: 1, productId: 1, type: 1 },
  { unique: false }
);
export default mongoose.model("Interaction", interactionSchema);
