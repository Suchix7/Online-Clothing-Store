// routes/payments.route.js
import express from "express";
import Stripe from "stripe";
import Product from "../models/product.model.js";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    // Helpful error so you know exactly what's wrong
    throw new Error(
      "STRIPE_SECRET_KEY is missing. Check your .env and server startup."
    );
  }
  return new Stripe(key);
}

async function calcCartTotalMinor(items = []) {
  let amount = 0;
  let currency = "usd";

  for (const it of items) {
    const p = await Product.findById(it.productId).lean();
    if (!p || !p.inStock) throw new Error("Invalid or out-of-stock product");
    const qty = Math.max(1, Number(it.qty || 1));

    let unitMinor =
      typeof p.priceMinor === "number"
        ? p.priceMinor
        : Math.round((p.sellingPrice || 0) * 100);

    if (it.variantSku && Array.isArray(p.variant)) {
      const v = p.variant.find((x) => x.sku === it.variantSku);
      if (!v) throw new Error("Invalid variant");
      const vMinor =
        typeof v.variantSPMinor === "number"
          ? v.variantSPMinor
          : Math.round((v.variantSP || 0) * 100);
      unitMinor = vMinor;
      if (typeof v.variantStock === "number" && v.variantStock < qty) {
        throw new Error("Variant out of stock");
      }
    }

    amount += unitMinor * qty;
    currency = p.currency || currency;
  }
  return { amount, currency };
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
});

router.post("/create-intent", async (req, res) => {
  try {
    const { customerEmail, items } = req.body;

    // TODO: replace with your real calc (you already wrote calcCartTotalMinor)
    const amount = Array.isArray(items)
      ? items.reduce((sum, it) => sum + Number(it.qty || 1) * 1000, 0)
      : 1000;

    const pi = await stripe.paymentIntents.create({
      amount,
      currency: "usd",
      receipt_email: customerEmail,
      automatic_payment_methods: { enabled: true },
    });

    // helpful to verify account/mode alignment on the client:
    const acct = await stripe.accounts.retrieve();

    res.json({
      clientSecret: pi.client_secret,
      paymentIntentId: pi.id,
      livemode: pi.livemode, // false in test
      account: acct.id, // e.g. "acct_123..."
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

router.post("/webhook", (req, res) => {
  // Add signature verification later
  res.json({ received: true });
});
console.log(
  "PORT:",
  process.env.PORT,
  "STRIPE_SECRET_KEY set:",
  !!process.env.STRIPE_SECRET_KEY
);

export default router;
