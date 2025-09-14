import Checkout from "../models/checkout.model.js";
import { createOrderFromCheckout } from "./order.controller.js";

export const createCheckout = async (req, res) => {
  try {
    const { userId, username, mail, phoneNumber, products, shippingAddress } =
      req.body;

    // Validate required fields
    if (!userId || !products || !shippingAddress) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: userId, or shippingAddress",
      });
    }

    const checkout = new Checkout({
      userId,
      username,
      mail,
      phoneNumber,
      products,
      shippingAddress,
    });

    // Save checkout
    await checkout.save();

    // Create order from checkout
    const order = await createOrderFromCheckout(checkout._id);
    if (!order) {
      return res.status(500).json({
        success: false,
        message: "Failed to create order from checkout",
      });
    }
    return res.status(200).json({
      message: "Checkout created successfully",
    });
  } catch (error) {
    console.error("Checkout error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during checkout",
      error: error.message,
    });
  }
};
