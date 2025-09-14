import mongoose, { modelNames } from "mongoose";

const cartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      unique: true,
    },
    products: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
        },
        name: {
          type: String,
        },
        price: {
          type: Number,
        },
        quantity: {
          type: Number,
          default: 1,
        },
        image: {
          type: String,
        },
        color: {
          type: String,
          default: "No color chosen",
        },
        variant: {
          type: String,
          default: "No variant chosen",
        },
        model: {
          type: String,
          default: "No model chosen",
        },
        modelName: {
          type: String,
        },
      },
    ],
    status: {
      type: String,
    },
  },
  { timestamps: true }
);

const Cart = mongoose.model("Cart", cartSchema);

export default Cart;
