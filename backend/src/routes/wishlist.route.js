import express from "express";
import Wishlist from "../models/wishlist.model.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { userId, productId, name, price, image, inStock } = req.body;

    const wishlistItem = {
      productId,
      name,
      price,
      image,
      inStock,
    };
    const user = await Wishlist.findOne({ userId });
    if (user) {
      const alreadyInWishlist = user.products.some(
        (item) => item.productId.toString() === productId
      );

      if (alreadyInWishlist) {
        return res.status(409).json({ message: "Product already in wishlist" });
      }

      user.products.push(wishlistItem);
      await user.save();

      return res.status(200).json({ message: "Product added to wishlist" });
    }

    const newUser = new Wishlist({
      userId,
      products: [],
    });

    newUser.products.push(wishlistItem);
    await newUser.save();

    return res.status(200).json({ message: "Product added to wishlist" });
  } catch (error) {
    console.error("Error while posting wishlist:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const wishlist = await Wishlist.findOne({ userId });
    res.status(200).json({ wishlist });
  } catch (error) {
    console.log("Error while fetching wishlist:", error);
  }
});

router.delete("/:userId/:productId", async (req, res) => {
  const { userId, productId } = req.params;

  try {
    const wishlist = await Wishlist.findOne({ userId });

    if (!wishlist) {
      return res.status(404).json({ message: "Wishlist not found" });
    }

    const initialLength = wishlist.products.length;

    // Remove the product from the wishlist
    wishlist.products = wishlist.products.filter(
      (item) => item.productId.toString() !== productId
    );

    if (wishlist.products.length === initialLength) {
      return res.status(404).json({ message: "Product not found in wishlist" });
    }

    await wishlist.save();

    return res.status(200).json({
      message: "Product removed from wishlist",
      wishlist,
    });
  } catch (error) {
    console.error("Error removing from wishlist:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
