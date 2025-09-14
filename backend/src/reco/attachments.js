// reco/attachments.js
import Product from "../models/product.model.js";

export async function attachmentsFor(productId, limit = 8) {
  const seed = await Product.findById(productId).lean();
  if (!seed) return [];

  return Product.aggregate([
    {
      $match: {
        inStock: true,
        isAccessory: true,
        // same category family or known compat (models overlap)
        $or: [
          { category: seed.category },
          {
            subcategory: {
              $in: [
                "Covers",
                "Screen Protectors",
                "Cables",
                "Chargers",
                "Earbuds",
                "Powerbanks",
              ],
            },
          },
          { model: { $in: seed.model || [] } },
        ],
      },
    },
    {
      $addFields: {
        score: {
          $add: [
            {
              $min: [
                4,
                { $size: { $setIntersection: ["$model", seed.model || []] } },
              ],
            }, // compatibility is king
            { $cond: [{ $eq: ["$brand", seed.brand] }, 1.5, 0] },
            { $multiply: ["$popularity", 0.02] },
          ],
        },
      },
    },
    { $sort: { score: -1, popularity: -1 } },
    { $limit: limit },
    {
      $project: {
        name: 1,
        images: 1,
        sellingPrice: 1,
        subcategory: 1,
        model: 1,
      },
    },
  ]);
}
