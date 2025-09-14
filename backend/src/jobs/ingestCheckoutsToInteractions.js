// jobs/ingestCheckoutsToInteractions.js
import Checkout from "../models/checkout.model.js";
import Interaction from "../models/interaction.model.js";

export async function ingestCheckoutsToInteractions(sinceHours = 24) {
  const since = new Date(Date.now() - sinceHours * 3600 * 1000);
  const cursor = Checkout.aggregate([
    { $match: { createdAt: { $gte: since } } },
    { $unwind: "$products" },
    {
      $project: {
        userId: 1,
        productId: "$products.productId",
        ts: "$createdAt",
        type: { $literal: "cart" },
        weight: { $literal: 5 },
      },
    },
  ])
    .cursor({ batchSize: 500 })
    .exec();

  for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
    if (!doc.productId) continue;
    await Interaction.create(doc).catch(() => {});
  }
}
