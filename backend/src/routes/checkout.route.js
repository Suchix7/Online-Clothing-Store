import express from "express";
import { createCheckout } from "../controllers/checkout.controller.js";
import Checkout from "../models/checkout.model.js";

const checkoutRouter = express.Router();

// POST /api/checkout just to push
checkoutRouter.post("/", createCheckout);

checkoutRouter.delete("/", async (req, res) => {
  try {
    await Checkout.deleteMany({});
    res.status(200).json({ message: "Checkouts deleted successfully" });
  } catch (error) {
    console.error("Error while deleting checkouts: ", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default checkoutRouter;
