// jobs/ingestOrdersToInteractions.js
import Order from "../models/order.model.js";
import Interaction from "../models/interaction.model.js";

export async function ingestOrdersToInteractions(sinceDays = 60) {
  const since = new Date(Date.now() - sinceDays * 24 * 3600 * 1000);
  const cursor = Order.aggregate(
    [
      { $match: { createdAt: { $gte: since } } },
      { $project: { userId: 1, products: 1, createdAt: 1 } },
      { $unwind: "$products" },
      {
        $project: {
          userId: 1,
          productId: "$products.productId",
          ts: "$createdAt",
          type: { $literal: "purchase" },
          weight: { $literal: 10 },
        },
      },
    ],
    { allowDiskUse: true }
  )
    .cursor({ batchSize: 500 })
    .exec();

  for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
    if (!doc.productId) continue;
    await Interaction.create(doc).catch(() => {});
  }
}
