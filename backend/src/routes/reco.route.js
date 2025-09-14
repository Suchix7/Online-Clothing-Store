// routes/reco.js
import { Router } from "express";
import { similarItems } from "../reco/similarItems.js";
import { personalizedForUser } from "../reco/personalized.js";
import { fbt } from "../reco/fbt.js";
import Product from "../models/product.model.js";
import { rerank } from "../reco/rerank.js";

const r = Router();

r.get("/similar/:productId", async (req, res) => {
  const items = await similarItems(req.params.productId);
  res.json({ type: "similar", items });
});

r.get("/fbt/:productId", async (req, res) => {
  const pairs = await fbt(req.params.productId, 12);
  // join to product docs
  const ids = pairs.map((p) => p.b);
  const items = await Product.find({ _id: { $in: ids }, inStock: true })
    .select("name images sellingPrice ratingAvg popularity")
    .lean();
  // order by c
  const byId = new Map(items.map((i) => [String(i._id), i]));
  const ordered = pairs.map((p) => byId.get(String(p.b))).filter(Boolean);
  res.json({ type: "fbt", items: ordered });
});

r.get("/personalized/:userId", async (req, res) => {
  const userId = req.params.userId;
  if (!userId) return res.json({ type: "personal", items: [] });
  const items = await personalizedForUser(userId);
  res.json({ type: "personal", items });
});

r.get("/home", async (req, res) => {
  const trending = await Product.find({ inStock: true })
    .sort({ popularity: -1, ratingAvg: -1, createdAt: -1 })
    .limit(20)
    .select("name images sellingPrice ratingAvg popularity")
    .lean();

  // optional: merge with personal for signed‑in users
  const userId = req.user?._id;
  const personal = userId ? await personalizedForUser(userId, 20) : [];
  const items = rerank([
    { type: "trending", items: trending },
    { type: "personal", items: personal },
  ]);
  res.json({ type: "feed", items });
});

export default r;
