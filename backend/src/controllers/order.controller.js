import Order from "../models/order.model.js";
import Checkout from "../models/checkout.model.js";
import { io } from "../index.js";
import Interaction from "../models/interaction.model.js";
import CoPurchase from "../models/copurchase.model.js";

const decreaseStock = async () => {};

export const createOrderFromCheckout = async (checkoutId) => {
  const checkout = await Checkout.findById(checkoutId);
  if (!checkout) throw new Error("Checkout not found");

  const order = new Order({
    userId: checkout.userId,
    username: checkout.username,
    mail: checkout.mail,
    phoneNumber: checkout.phoneNumber,
    checkoutId: checkout._id,
    orderId: checkout.orderId,
    products: checkout.products.map((item) => ({
      productId: item.productId,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      image: item.image,
      color: item.color,
      variant: item.variant,
      model: item.model,
    })),
    totalAmount: checkout.products.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    ),
    paymentMethod: checkout.paymentMethod,
    paymentStatus: checkout.paymentStatus,
    shippingAddress: checkout.shippingAddress,
    status: "processing",
  });

  const savedOrder = await order.save();

  (async () => {
    try {
      const docs = (savedOrder.products || [])
        .filter((p) => p.productId)
        .map((p) => ({
          userId: savedOrder.userId,
          productId: p.productId,
          type: "purchase",
          weight: 10,
          ts: savedOrder.createdAt,
        }));

      if (docs.length) await Interaction.insertMany(docs, { ordered: false });
    } catch (e) {
      console.error("Interaction log failed:", e?.message);
    }
  })();

  // OPTIONAL: incrementally update co‑purchase counts for this single order
  // so FBT shows up immediately (you can still keep the nightly batch job)
  (async () => {
    try {
      const ids = [
        ...new Set(
          (savedOrder.products || [])
            .map((p) => String(p.productId))
            .filter(Boolean)
        ),
      ];
      for (let i = 0; i < ids.length; i++) {
        for (let j = i + 1; j < ids.length; j++) {
          await CoPurchase.updateOne(
            { a: ids[i], b: ids[j] },
            { $inc: { c: 1 } },
            { upsert: true }
          );
          await CoPurchase.updateOne(
            { a: ids[j], b: ids[i] },
            { $inc: { c: 1 } },
            { upsert: true }
          );
        }
      }
    } catch (e) {
      console.error("FBT incremental update failed:", e?.message);
    }
  })();

  // ✅ Emit socket event after order is saved
  io.to("dashboard").emit("newOrder", {
    username: savedOrder.username,
    orderId: savedOrder.orderId,
    createdAt: savedOrder.createdAt,
    products: savedOrder.products,
    shippingAddress: savedOrder.shippingAddress,
    mail: savedOrder.mail,
    phoneNumber: savedOrder.phoneNumber,
    status: savedOrder.status,
  });

  return savedOrder;
};

export const getOrdersForUser = async (userId) => {
  try {
    const orders = await Order.find({ userId }).sort({ createdAt: -1 });

    return orders;
  } catch (error) {
    console.log("Error fetching orders:", error.message);
  }
};
