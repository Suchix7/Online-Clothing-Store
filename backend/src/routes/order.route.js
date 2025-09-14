import express from "express";
import {
  createOrderFromCheckout,
  getOrdersForUser,
} from "../controllers/order.controller.js";
import Order from "../models/order.model.js";
import User from "../models/user.model.js";

const orderRouter = express.Router();

// POST /api/orders (typically called internally after payment)
orderRouter.post("/", async (req, res) => {
  try {
    const order = await createOrderFromCheckout(req.body.checkoutId);
    res.status(201).json(order);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// GET /api/orders (user's order history)
// orderRouter.get("/:userId", async (req, res) => {
//   const { userId } = req.params;
//   try {
//     const orders = await getOrdersForUser(userId);
//     res.json(orders);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

orderRouter.get("/", async (req, res) => {
  try {
    const orders = await Order.find({});

    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: "Orders not found" + error.message });
  }
});

orderRouter.get("/dashboard/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const order = await Order.findOne({ orderId: id });

    if (!order) {
      return res.status(400).json({ message: "No orders found." });
    }

    return res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ error: "Error fetching order" + error.message });
  }
});

orderRouter.get("/user/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const find = await Order.findOne({ orderId: id });

    if (!find) {
      return res.status(400).json("No orders found");
    }

    return res.status(200).json(find);
  } catch (error) {
    res.status(500).json({ error: "Error fetching order" + error.message });
  }
});

orderRouter.put("/:id", async (req, res) => {
  const { id } = req.params;
  const updatedOrder = req.body;
  try {
    const order = await Order.findOneAndUpdate(
      { orderId: id }, // Find order by orderId
      { $set: updatedOrder }, // Update with provided fields
      { new: true } // Return the updated document
    );

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: "Error updating order" + error.message });
  }
});

orderRouter.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const orders = await Order.find({ userId: id });

    if (!orders) {
      return res.status(400).json({ message: "No orders found." });
    }

    return res.status(200).json(orders);
  } catch (error) {
    console.log("Error while fetching orders: ", error);
    res
      .status(500)
      .json({ error: "Error while fetching orders" + error.message });
  }
});

orderRouter.delete("/", async (req, res) => {
  try {
    await Order.deleteMany({});
    res.status(200).json({ message: "Orders deleted successfully" });
  } catch (error) {
    console.error("Error while deleting checkouts: ", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default orderRouter;
