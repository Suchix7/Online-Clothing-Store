// routes/search.js
import express from "express";
import mongoose from "mongoose";
const router = express.Router();

const PRODUCTS = mongoose.connection.collection("products");

// terms that explicitly allow covers/protectors
const ALLOW_ACCESSORY_TERMS =
  /(screen\s*protector|tempered\s*glass|glass|cover|case|back\s*cover|flip\s*case|camera\s*glass)/i;

router.get("/search", async (req, res) => {
  const q = (req.query.q || "").trim();
  const page = Math.max(parseInt(req.query.page || "1"), 1);
  const limit = Math.min(parseInt(req.query.limit || "10"), 50);
  const skip = (page - 1) * limit;

  const ALLOW_ACCESSORY_TERMS =
    /(screen\s*protector|tempered\s*glass|glass|cover|case|back\s*cover|flip\s*case|camera\s*glass)/i;
  const allowAccessories = ALLOW_ACCESSORY_TERMS.test(q);

  const pipeline = [
    {
      $search: {
        index: "product_search",
        compound: {
          should: [
            // Autocomplete (fuzzy OK)
            {
              autocomplete: {
                query: q,
                path: "name_auto",
                fuzzy: { maxEdits: 1 },
              },
            },
            {
              autocomplete: {
                query: q,
                path: "model_auto",
                fuzzy: { maxEdits: 1 },
              },
            },

            // Text with synonyms (NO fuzzy)
            {
              text: {
                query: q,
                path: ["name", "modelName", "tags"],
                synonyms: "shop_syns",
              },
            },

            // Text with fuzzy (NO synonyms)
            {
              text: {
                query: q,
                path: ["name", "modelName", "tags"],
                fuzzy: { maxEdits: 1 },
              },
            },

            // Phrase boosts
            {
              phrase: {
                query: q,
                path: "modelName",
                slop: 2,
                score: { boost: { value: 5 } },
              },
            },
            {
              phrase: {
                query: q,
                path: "brand",
                slop: 1,
                score: { boost: { value: 3 } },
              },
            },
          ],
          minimumShouldMatch: 1,

          // Hide accessories unless explicitly asked
          filter: allowAccessories
            ? []
            : [
                { exists: { path: "category" } },
                { range: { path: "sellingPrice", gte: 0 } },
                {
                  compound: {
                    mustNot: [
                      {
                        text: {
                          query: ["Covers", "Screen Protectors", "Cases"],
                          path: "subcategory",
                        },
                      },
                      {
                        text: {
                          query: ["Covers", "Screen Protectors", "Cases"],
                          path: "category",
                        },
                      },
                      {
                        text: {
                          query: ["Covers", "Screen Protectors", "Cases"],
                          path: "parentSubcategory",
                        },
                      },
                    ],
                  },
                },
              ],
        },
        highlight: { path: ["name", "modelName", "tags"] },
        // Removed score.function stub — invalid/unused. We'll re-rank below.
      },
    },

    // Post-search lightweight re-ranking
    {
      $addFields: {
        _popBoost: { $divide: ["$popularity", 1000] },
        _ratingBoost: { $divide: ["$ratingAvg", 10] },
        _stockBoost: { $cond: ["$inStock", 0.1, -0.1] },
        _searchBase: { $meta: "searchScore" },
      },
    },
    {
      $addFields: {
        score: {
          $add: ["$_searchBase", "$_popBoost", "$_ratingBoost", "$_stockBoost"],
        },
      },
    },
    { $sort: { score: -1 } },

    {
      $facet: {
        results: [
          { $skip: skip },
          { $limit: limit },
          {
            $project: {
              _id: 1,
              name: 1,
              modelName: 1,
              brand: 1,
              category: 1,
              subcategory: 1,
              sellingPrice: 1,
              inStock: 1,
              ratingAvg: 1,
              images: { $slice: ["$images", 1] },
              highlight: { $meta: "searchHighlights" },
              score: 1,
            },
          },
        ],
        facets: [
          { $limit: 200 },
          {
            $group: {
              _id: null,
              categories: { $addToSet: "$category" },
              brands: { $addToSet: "$brand" },
            },
          },
          { $project: { _id: 0, categories: 1, brands: 1 } },
        ],
        totalCount: [{ $count: "count" }],
      },
    },
  ];

  // Helpful when debugging:
  // console.dir(pipeline, { depth: null });

  const [data] = await PRODUCTS.aggregate(pipeline).toArray();
  res.json({
    q,
    page,
    limit,
    total: data?.totalCount?.[0]?.count || 0,
    facets: data?.facets?.[0] || { categories: [], brands: [] },
    results: data?.results || [],
  });
});

router.get("/suggest", async (req, res) => {
  const q = (req.query.q || "").trim();
  if (!q) return res.json({ suggestions: [] });

  const pipeline = [
    {
      $search: {
        index: "product_search",
        compound: {
          should: [
            // Autocomplete (ok with fuzzy)
            {
              autocomplete: {
                query: q,
                path: "name_auto",
                fuzzy: { maxEdits: 1 },
              },
            },
            {
              autocomplete: {
                query: q,
                path: "model_auto",
                fuzzy: { maxEdits: 1 },
              },
            },

            // Synonyms pass (NO fuzzy here)
            {
              text: {
                query: q,
                path: ["name", "modelName", "tags"],
                synonyms: "shop_syns",
              },
            },

            // Fuzzy text pass (NO synonyms here)
            {
              text: {
                query: q,
                path: ["name", "modelName", "tags"],
                fuzzy: { maxEdits: 1 },
              },
            },
          ],
          minimumShouldMatch: 1,
        },
      },
    },
    { $limit: 12 },
    // project a single "suggestion" string — prefer modelName, else name
    {
      $project: {
        _id: 0,
        suggestion: {
          $ifNull: ["$modelName", "$name"],
        },
      },
    },
  ];

  const docs = await PRODUCTS.aggregate(pipeline).toArray();

  // de-dupe (case-insensitive), keep order
  const seen = new Set();
  const suggestions = [];
  for (const d of docs) {
    const s = (d.suggestion || "").trim();
    if (!s) continue;
    const key = s.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      suggestions.push(s);
    }
    if (suggestions.length >= 10) break; // cap output
  }

  res.json({ suggestions });
});

export default router;
