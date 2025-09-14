import mongoose from "mongoose";
// models/CoPurchase.js (output table built by a cron)
const coPurchaseSchema = new mongoose.Schema({
  a: { type: mongoose.Schema.Types.ObjectId, index: true }, // product A
  b: { type: mongoose.Schema.Types.ObjectId, index: true }, // product B
  c: { type: Number, default: 0 }, // count
});
coPurchaseSchema.index({ a: 1, c: -1 });
export default mongoose.model("CoPurchase", coPurchaseSchema);
