import mongoose, { mongo } from "mongoose";

// const checkoutSchema = new mongoose.Schema({
//   // User Reference
//   userId: {
//     type: mongoose.Schema.Types.ObjectId,
//     required: true,
//   },

//   // Cart Reference
//   cartId: {
//     type: mongoose.Schema.Types.ObjectId,
//     required: true,
//   },

//   // Order Details
//   orderId: {
//     type: String,
//     unique: true,
//     default: () =>
//       `ORD-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
//   },
//   items: [
//     {
//       productId: {
//         type: mongoose.Schema.Types.ObjectId,
//         required: true,
//       },
//       name: { type: String, required: true },
//       quantity: { type: Number, required: true, min: 1 },
//       price: { type: Number, required: true },
//       image: { type: String },
//     },
//   ],

//   // Pricing Breakdown
//   //   subtotal: { type: Number, required: true },
//   //   tax: { type: Number, default: 0 },
//   //   shippingFee: { type: Number, default: 0 },
//   //   discount: { type: Number, default: 0 },
//   //   total: { type: Number, required: true },

//   // Payment Information
//   paymentMethod: {
//     type: String,
//     enum: ["esewa", "khalti", "banking", "cod"],
//     default: "cod",
//     required: true,
//   },
//   paymentStatus: {
//     type: String,
//     enum: ["pending", "completed", "failed", "refunded"],
//     default: "pending",
//   },
//   transactionId: { type: String },

//   // Shipping Information
//   shippingAddress: {
//     street: { type: String, required: true },
//     city: { type: String, required: true },
//     state: { type: String, required: true },
//     postalCode: { type: String, required: true },
//   },
//   trackingNumber: { type: String },
//   shippingStatus: {
//     type: String,
//     enum: ["processing", "shipped", "delivered", "returned"],
//     default: "processing",
//   },

//   // Timestamps
//   createdAt: { type: Date, default: Date.now },
//   updatedAt: { type: Date, default: Date.now },
//   deliveredAt: { type: Date },
// });

// // Auto-update the 'updatedAt' field before saving
// // checkoutSchema.pre('save', function(next) {
// //   this.updatedAt = new Date();
// //   next();
// // });

const checkoutSchema = new mongoose.Schema(
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
      type: Number,
    },
    orderId: {
      type: String,
      unique: true,
      default: () =>
        `ORD-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
    },
    products: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId },
        name: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true },
        image: { type: String },
        color: { type: String, default: "No color chosen" },
        variant: { type: String, default: "No variant chosen" },
        model: { type: String, default: "No model chosen" },
      },
    ],
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
  },
  { timestamps: true }
);

checkoutSchema.index({ "products.productId": 1 });
checkoutSchema.index({ userId: 1, _id: -1 });

const Checkout = mongoose.model("Checkout", checkoutSchema);
export default Checkout;
