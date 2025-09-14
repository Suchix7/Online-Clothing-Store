// reco/similarItems.js (relaxed but smarter)
import Product from "../models/product.model.js";
export async function similarItems(productId, limit = 12) {
  const seed = await Product.findById(productId).lean();
  if (!seed) return [];
  const minPrice = Math.max(0, seed.sellingPrice * 0.7);
  const maxPrice = seed.sellingPrice * 1.3;

  return Product.aggregate([
    {
      $match: {
        _id: { $ne: seed._id },
        inStock: true,
        category: seed.category, // <-- relax: only category required
      },
    },
    {
      $addFields: {
        score: {
          $add: [
            // subcategory exact match becomes a BOOST, not a filter
            { $cond: [{ $eq: ["$subcategory", seed.subcategory] }, 6, 0] },
            { $cond: [{ $eq: ["$brand", seed.brand] }, 4, 0] },
            {
              $multiply: [
                { $size: { $setIntersection: ["$tags", seed.tags || []] } },
                2,
              ],
            },
            {
              $min: [
                4,
                { $size: { $setIntersection: ["$model", seed.model || []] } },
              ],
            },
            {
              $cond: [
                {
                  $and: [
                    { $gte: ["$sellingPrice", minPrice] },
                    { $lte: ["$sellingPrice", maxPrice] },
                  ],
                },
                2,
                0,
              ],
            },
            { $multiply: ["$ratingAvg", 0.5] },
            { $multiply: ["$popularity", 0.02] },
          ],
        },
      },
    },
    { $sort: { score: -1, popularity: -1, createdAt: -1 } },
    { $limit: limit },
    {
      $project: {
        name: 1,
        modelName: 1,
        images: 1,
        sellingPrice: 1,
        ratingAvg: 1,
        popularity: 1,
        brand: 1,
        parentSubcategory: 1,
        color: 1,
        stock: 1,
        parentCategory: 1,
      },
    },
  ]);
}
