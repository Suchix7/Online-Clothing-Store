import mongoose, { model } from "mongoose";
import Product from "./product.model.js";

// const orderSchema = new mongoose.Schema({
//   // References
//   userId: {
//     type: mongoose.Schema.Types.ObjectId,
//     required: true,
//     ref: "User",
//   },
//   checkoutId: {
//     type: mongoose.Schema.Types.ObjectId,
//     required: true,
//   },

//   // Immutable order snapshot
//   items: [
//     {
//       productId: {
//         type: mongoose.Schema.Types.ObjectId,
//         required: true,
//         ref: "Product",
//       },
//       name: { type: String, required: true },
//       priceAtPurchase: { type: Number, required: true }, // Critical for historical accuracy
//       quantity: { type: Number, required: true },
//       image: { type: String },
//     },
//   ],

//   // Financials (snapshotted from checkout)
//   totalAmount: { type: Number, required: true },

//   // Fulfillment
//   shippingAddress: {
//     type: {
//       street: { type: String, required: true },
//       city: { type: String, required: true },
//       state: { type: String, required: true },
//       postalCode: { type: String, required: true },
//     },
//     required: true,
//   },
//   trackingNumber: { type: String },
//   status: {
//     type: String,
//     enum: ["processing", "shipped", "delivered", "cancelled"],
//     default: "processing",
//   },

//   // Timestamps
//   createdAt: { type: Date, default: Date.now },
//   updatedAt: { type: Date, default: Date.now },
//   deliveredAt: { type: Date },
// });

// Indexes for faster queries
// orderSchema.index({ userId: 1 });
// orderSchema.index({ status: 1 });
// orderSchema.index({ createdAt: -1 });

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    username: {
      type: String,
    },
    mail: {
      type: String,
    },
    phoneNumber: {
      type: String,
    },
    checkoutId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    orderId: {
      type: String,
      unique: true,
    },
    products: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId },
        name: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true },
        image: { type: String },
        color: { type: String },
        variant: { type: String },
        model: { type: String },
      },
    ],
    totalAmount: {
      type: Number,
    },
    paymentMethod: {
      type: String,
      default: "cod",
    },
    paymentStatus: {
      type: String,
      default: "pending",
    },
    shippingAddress: {
      street: { type: String, default: "" },
      city: { type: String, default: "" },
      landMark: { type: String, default: "" },
      location: {
        lat: Number,
        lng: Number,
      },
      shortnote: String,
      province: String,
      district: String,
      municipality: String,
    },

    status: {
      type: String,
      enum: ["processing", "shipped", "delivered", "cancelled"],
      default: "processing",
    },
  },
  { timestamps: true }
);
orderSchema.index({ "products.productId": 1 });
orderSchema.index({ userId: 1, createdAt: -1 });

const Order = mongoose.model("Order", orderSchema);
export default Order;
