import Cart from "../models/cart.model.js";
import mongoose from "mongoose";
import { logInteraction } from "../utils/logInteraction.js";

export const addToCart = async (req, res) => {
  const {
    userId,
    productId,
    name,
    price,
    quantity,
    image,
    color,
    variant,
    model,
    status,
    modelName,
  } = req.body;

  if (!userId || !productId || !quantity) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    // 1. Check for existing cart
    const userObjectId = new mongoose.Types.ObjectId(userId);
    let cart = await Cart.findOne({ userId: userObjectId });

    // const productObjectId = new mongoose.Types.ObjectId(productId);
    if (cart) {
      // 2. Check if product already exists in cart
      console.log("Before", cart.products);
      const existingProductIndex = cart.products.findIndex(
        (item) =>
          item.productId.toString() === productId &&
          item.color === color &&
          item.variant === variant &&
          item.model === model &&
          item.modelName === modelName
      );

      if (existingProductIndex >= 0) {
        cart.products[existingProductIndex].quantity =
          Number(cart.products[existingProductIndex].quantity) +
          Number(quantity);
      } else {
        // Add new product if it doesn't exist
        cart.products.push({
          productId,
          name,
          price,
          quantity,
          image,
          color,
          variant,
          model: model,
          modelName,
        });
      }
      // 3. Save the updated cart
      const updatedCart = await cart.save();
      (async () => {
        await logInteraction({
          userId,
          productId,
          type: "cart",
          weight: 5,
          meta: { quantity, color, variant, model, source: "addToCart" },
        });
      })();
      console.log("After", updatedCart);
      return res.status(200).json({
        message:
          existingProductIndex >= 0
            ? "Item quantity updated in cart"
            : "Item added to cart",
        cart: updatedCart,
      });
    }

    // 4. Create new cart if none exists
    const newCart = new Cart({
      userId,
      products: [
        {
          productId,
          name,
          price,
          quantity,
          image,
          color,
          variant,
          model: model,
          modelName,
        },
      ],
      status,
    });

    const savedCart = await newCart.save();
    (async () => {
      await logInteraction({
        userId,
        productId,
        type: "cart",
        weight: 5,
        meta: { quantity, color, variant, model, source: "addToCart:newCart" },
      });
    })();
    return res.status(201).json({
      message: "New cart created with item",
      cart: savedCart,
    });
  } catch (error) {
    console.error("Error in addToCart:", error);
    res.status(500).json({
      message: "Error processing cart operation",
      error: error.message,
    });
  }
};

export const deleteProductFromCart = async (req, res) => {
  const { productId, userId } = req.params;
  const { color, variant, model } = req.body;

  try {
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const cart = await Cart.findOne({ userId: userObjectId });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    cart.products = cart.products.filter(
      (product) =>
        !(
          String(product.productId) === String(productId) &&
          product.color?.toLowerCase() === color?.toLowerCase() &&
          product.variant?.toLowerCase() === variant?.toLowerCase() &&
          product.model?.toLowerCase() === model?.toLowerCase()
        )
    );

    const updatedCart = await cart.save();
    (async () => {
      await logInteraction({
        userId,
        productId,
        type: "cart_remove",
        weight: 3,
        meta: { color, variant, model },
      });
    })();
    return res.status(200).json({
      message: "Product removed from cart",
      cart: updatedCart,
    });
  } catch (error) {
    console.error("Error deleting product from cart:", error);
    res.status(500).json({
      message: "Error deleting product from cart",
      error: error.message,
    });
  }
};

export const cartIncrement = async (req, res) => {
  const { productId, userId } = req.params;
  const { color, model, variant } = req.body;
  try {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const cart = await Cart.findOne({ userId: userObjectId });

    if (!cart) {
      return res.status(500).json({ message: "No cart found." });
    }

    // 2. Convert productId (string) to ObjectId for comparison
    const productObjectId = new mongoose.Types.ObjectId(productId);

    const productIndex = cart.products.findIndex(
      (product) =>
        product.productId.equals(productObjectId) &&
        product.color === color &&
        product.model === model &&
        product.variant === variant
    );

    if (productIndex === -1) {
      return res.status(404).json({ message: "Product not found in cart." });
    }

    cart.products[productIndex].quantity += 1;

    const updatedCart = await cart.save();

    (async () => {
      await logInteraction({
        userId,
        productId,
        type: "cart_adjust",
        weight: 2,
        meta: { delta: +1, color, variant, model },
      });
    })();

    if (!updatedCart) {
      return res
        .status(500)
        .json({ message: "Couldn't increment the quantity" });
    }

    return res
      .status(200)
      .json({ message: "Quantity incremented", updatedCart });
  } catch (error) {
    res.status(500).json({ error: "Failed to increment product" });
  }
};

export const cartDecrement = async (req, res) => {
  const { productId, userId } = req.params;
  const { color, model, variant } = req.body;
  try {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const cart = await Cart.findOne({ userId: userObjectId });

    if (!cart) {
      return res.status(500).json({ message: "No cart found." });
    }

    const productObjectId = new mongoose.Types.ObjectId(productId);

    const productIndex = cart.products.findIndex(
      (product) =>
        product.productId.equals(productObjectId) &&
        product.color === color &&
        product.model === model &&
        product.variant === variant
    );

    if (productIndex === -1) {
      return res.status(404).json({ message: "Product not found in cart." });
    }

    if (cart.products[productIndex].quantity <= 1) {
      return res.status(400).json({
        message:
          "Cannot decrement quantity below 1. Remove the product instead.",
      });
    }

    cart.products[productIndex].quantity -= 1;

    const updatedCart = await cart.save();
    (async () => {
      await logInteraction({
        userId,
        productId,
        type: "cart_adjust",
        weight: 1,
        meta: { delta: -1, color, variant, model },
      });
    })();

    if (!updatedCart) {
      return res
        .status(500)
        .json({ message: "Couldn't decrement the quantity" });
    }

    return res
      .status(200)
      .json({ message: "Quantity decremented", updatedCart });
  } catch (error) {
    res.status(500).json({ error: "Failed to decrement product" });
  }
};

export const getCart = async (req, res) => {
  const { userId } = req.params;
  try {
    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return res.status(500).json({ error: "No available cart." });
    }

    return res.status(200).json(cart);
  } catch (error) {
    res.status(500).json({ error: "Failed to get cart items." });
  }
};

export const removeCart = async (req, res) => {
  const { userId } = req.params;
  try {
    const cart = await Cart.findOne({ userId });

    cart.products = [];

    await cart.save();
    return res.status(200).json({ message: "Cart cleared" });
  } catch (error) {
    console.log(error);
  }
};

export const syncCart = async (req, res) => {
  const { userId, items = [], status } = req.body;

  if (!userId || !Array.isArray(items)) {
    return res.status(400).json({ message: "Invalid payload" });
  }

  try {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    let cart = await Cart.findOne({ userId: userObjectId });

    if (!cart) {
      cart = new Cart({ userId, products: items, status });
    } else {
      for (let item of items) {
        const existingIndex = cart.products.findIndex(
          (p) =>
            p.productId.toString() === item.productId &&
            p.color === item.color &&
            p.variant === item.variant &&
            p.model === item.model
        );

        if (existingIndex >= 0) {
          cart.products[existingIndex].quantity += Number(item.quantity);
        } else {
          cart.products.push(item);
          (async () => {
            await logInteraction({
              userId,
              productId: item.productId,
              type: "cart",
              weight: 5,
              meta: {
                quantity: item.quantity,
                color: item.color,
                variant: item.variant,
                model: item.model,
                source: "syncCart",
              },
            });
          })();
        }
      }
    }

    const saved = await cart.save();
    res.status(200).json({ message: "Cart synced", cart: saved });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
