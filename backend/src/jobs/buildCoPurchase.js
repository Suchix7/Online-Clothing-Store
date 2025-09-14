// jobs/buildCoPurchase.js
import Order from "../models/order.model.js";
import CoPurchase from "../models/copurchase.model.js";
import mongoose from "mongoose";

export async function buildCoPurchase(sinceDays = 120, minCount = 2) {
  const since = new Date(Date.now() - sinceDays * 24 * 3600 * 1000);

  const pipeline = [
    { $match: { createdAt: { $gte: since } } },
    { $project: { items: "$products.productId" } },
    { $addFields: { items: { $setDifference: ["$items", [null]] } } },
    { $match: { "items.1": { $exists: true } } }, // only orders with >= 2 products
    {
      $project: {
        pairs: {
          $function: {
            body: function (arr) {
              // all unordered unique pairs
              const out = [];
              for (let i = 0; i < arr.length; i++) {
                for (let j = i + 1; j < arr.length; j++) {
                  out.push([arr[i], arr[j]]);
                }
              }
              return out;
            },
            args: ["$items"],
            lang: "js",
          },
        },
      },
    },
    { $unwind: "$pairs" },
    {
      $group: {
        _id: {
          a: { $arrayElemAt: ["$pairs", 0] },
          b: { $arrayElemAt: ["$pairs", 1] },
        },
        c: { $sum: 1 },
      },
    },
    { $match: { c: { $gte: minCount } } },
    { $project: { a: "$_id.a", b: "$_id.b", c: 1, _id: 0 } },
  ];

  const pairs = await Order.aggregate(pipeline, { allowDiskUse: true });

  // Upsert both directions (a->b and b->a)
  const ops = [];
  for (const p of pairs) {
    ops.push({
      updateOne: {
        filter: { a: p.a, b: p.b },
        update: { $set: { c: p.c } },
        upsert: true,
      },
    });
    ops.push({
      updateOne: {
        filter: { a: p.b, b: p.a },
        update: { $set: { c: p.c } },
        upsert: true,
      },
    });
  }
  if (ops.length) await CoPurchase.bulkWrite(ops, { ordered: false });

  // Optional: decay old links (simple multiplicative decay)
  await CoPurchase.updateMany({}, { $mul: { c: 0.98 } });
}
