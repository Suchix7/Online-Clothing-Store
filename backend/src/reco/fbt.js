// reco/fbt/:productId
import CoPurchase from "../models/copurchase.model.js";
export async function fbt(productId, limit = 8) {
  return CoPurchase.find({ a: productId }).sort({ c: -1 }).limit(limit).lean();
}
