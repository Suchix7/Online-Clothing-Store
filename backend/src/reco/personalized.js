// reco/personalized.js
import Product from "../models/product.model.js";
import Interaction from "../models/interaction.model.js";
import mongoose from "mongoose";

export async function personalizedForUser(userId, limit = 16) {
  const recent = await Interaction.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        ts: { $gte: new Date(Date.now() - 90 * 24 * 3600 * 1000) },
      },
    },
    { $sort: { ts: -1 } },
    { $limit: 400 },
    {
      $lookup: {
        from: "products",
        localField: "productId",
        foreignField: "_id",
        as: "p",
      },
    },
    { $unwind: "$p" },
    {
      $group: {
        _id: null,
        brands: { $addToSet: "$p.brand" },
        cats: { $addToSet: "$p.category" },
        subcats: { $addToSet: "$p.subcategory" },
        tags: { $push: "$p.tags" },
        models: { $push: "$p.model" },
      },
    },
    {
      $project: {
        brands: 1,
        cats: 1,
        subcats: 1,
        tags: { $setUnion: "$tags" },
        models: { $setUnion: "$models" },
      },
    },
  ]);
  const pref = recent[0] || {
    brands: [],
    cats: [],
    subcats: [],
    tags: [],
    models: [],
  };

  return Product.aggregate([
    {
      $match: {
        inStock: true,
        $or: [
          { category: { $in: pref.cats } },
          { subcategory: { $in: pref.subcats } },
          { brand: { $in: pref.brands } },
          { tags: { $in: pref.tags } },
        ],
      },
    },
    {
      $addFields: {
        score: {
          $add: [
            { $cond: [{ $in: ["$brand", pref.brands] }, 5, 0] },
            {
              $multiply: [
                { $size: { $setIntersection: ["$tags", pref.tags] } },
                1.5,
              ],
            },
            {
              $min: [
                3,
                { $size: { $setIntersection: ["$model", pref.models] } },
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
        brand: 1,
      },
    },
  ]);
}
