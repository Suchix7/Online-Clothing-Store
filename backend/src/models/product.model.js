import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    // --- existing fields (kept) ---
    modelName: { type: String, required: true }, // e.g., "iPhone 12 Pro"
    name: { type: String, required: true }, // full product title
    costPrice: Number,
    sellingPrice: { type: Number, required: true },

    // Normalize naming for search (keep old fields for UI if you want)
    parentCategory: { type: String, required: true }, // e.g., "Mobiles"
    parentSubcategory: { type: String, required: true }, // e.g., "Covers"

    // --- NEW: normalized search taxonomy ---
    brand: { type: String, index: true, default: "" }, // <-- add brand if missing in your DB
    category: {
      type: String,
      index: true,
      default: function () {
        return this.parentCategory || "";
      },
    },
    subcategory: {
      type: String,
      index: true,
      default: function () {
        return this.parentSubcategory || "";
      },
    },

    // --- NEW: search helpers ---
    tags: { type: [String], index: true, default: [] }, // synonyms/keywords ("earbuds","pods","tempered glass")
    name_auto: { type: String, index: true }, // duplicate of name for Atlas autocomplete
    model_auto: { type: String, index: true }, // duplicate of modelName for Atlas autocomplete
    searchText: { type: String, index: true }, // denormalized blob for full-text fallback

    // --- signals for ranking ---
    inStock: {
      type: Boolean,
      default: function () {
        return (this.stock ?? 0) > 0;
      },
    },
    popularity: { type: Number, default: 0 }, // derive from sold/views
    ratingAvg: { type: Number, default: 0 }, // derived from rating/totalRating if you keep those

    // keep your existing extras/variants/colors/etc.
    extras: String,
    color: [{ colorName: String, image: String }],
    size: [{ sizeName: String }],
    variant: [
      {
        searchName: String,
        variantName: String,
        variantCP: Number,
        variantSP: Number,
        variantStock: Number,
        sku: String, // optional: handy for FBT and POS
        barcode: String, // optional: scanner support
      },
    ],

    // model array looks like "compatible with"—keep, but name it clearly in UI
    model: { type: [String], default: [] }, // compatibleModels (don’t rename now to avoid migration churn)

    bundle: [{ bundle: String, bundlePrice: Number }],
    description: { type: String, required: true },
    stock: { type: Number, required: true },
    images: { type: Array },
    video: { url: String, publicId: String },
    publicId: String,
    sold: { type: Number, default: 0 },

    // keep all your specs blocks
    specs: {
      processor: String,
      ram: String,
      storage: String,
      battery: String,
      display: String,
      camera: String,
      frontCamera: String,
      os: String,
      charging: String,
      connectivity: String,
      ipRating: String,
      warranty: String,
    },
    chargerSpecs: {
      model: String,
      chargeInput: String,
      chargeOutput: String,
      chargeType: String,
      connectorType: String,
      compatibility: String,
      cable: String,
      packageIncludes: String,
      warranty: String,
    },
    laptopSpecs: {
      processor: String,
      ram: String,
      storage: String,
      battery: String,
      display: String,
      graphics: String,
      ports: String,
      os: String,
      build: String,
      connectivity: String,
      warranty: String,
    },
    powerbankSpecs: {
      capacity: String,
      outputPort: String,
      inputPort: String,
      outputPower: String,
      inputPower: String,
      chargingTech: String,
      material: String,
      weight: String,
      compatibility: String,
      specialFeatures: String,
      warranty: String,
    },
    earbudSpecs: {
      bluetoothVersion: String,
      batteryLife: String,
      chargingTime: String,
      driverSize: String,
      microphone: String,
      noiseCancellation: String,
      touchControls: String,
      ipRating: String,
      compatibility: String,
      specialFeatures: String,
      warranty: String,
    },
    watchSpecs: {
      display: String,
      resolution: String,
      batteryLife: String,
      os: String,
      connectivity: String,
      sensors: String,
      waterResistance: String,
      compatibility: String,
      healthFeatures: String,
      specialFeatures: String,
      warranty: String,
    },
    speakerSpecs: {
      model: String,
      speakerType: String,
      outputPower: String,
      connectivity: String,
      bluetoothRange: String,
      batteryLife: String,
      playbackTime: String,
      chargingTime: String,
      waterResistance: String,
      frequencyResponse: String,
      dimensions: String,
      weight: String,
      packageIncludes: String,
      warranty: String,
    },

    keyFeatures: String,

    // ratings as you had them
    reviews: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    totalRating: { type: Number, default: 0 },

    // --- NEW: business rules flags ---
    isAccessory: { type: Boolean, default: false }, // true for covers, protectors, cables, etc.
  },
  { timestamps: true }
);

// Virtuals / pre-save normalization
productSchema.pre("save", function (next) {
  this.name_auto = this.name;
  this.model_auto = this.modelName;
  // Simple average if you keep old fields
  if (!this.ratingAvg)
    this.ratingAvg = this.ratingCount
      ? this.totalRating / Math.max(this.ratingCount, 1)
      : this.rating;
  this.inStock = (this.stock ?? 0) > 0;

  // Build a denormalized text field (helps fallbacks / vectorization later)
  const bits = [
    this.name,
    this.modelName,
    this.brand,
    this.category,
    this.subcategory,
    ...(this.tags || []),
    ...(this.model || []), // compatible models
    this.keyFeatures,
    this.description,
  ].filter(Boolean);
  this.searchText = bits.join(" ").replace(/\s+/g, " ").trim();

  // Cheap popularity default from sold if not set
  if (!this.popularity && typeof this.sold === "number")
    this.popularity = this.sold;
  next();
});

// Useful indexes (Mongo, not Atlas Search)
productSchema.index({
  name: "text",
  modelName: "text",
  searchText: "text",
  tags: "text",
}); // fallback
productSchema.index({ brand: 1, category: 1, subcategory: 1, inStock: 1 });
productSchema.index({ popularity: -1 });
productSchema.index({ createdAt: -1 });

const Product = mongoose.model("product", productSchema);
export default Product;
