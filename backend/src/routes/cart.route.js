import express from "express";
import {
  addToCart,
  cartDecrement,
  cartIncrement,
  deleteProductFromCart,
  getCart,
  removeCart,
  syncCart,
} from "../controllers/cart.controller.js";
import Cart from "../models/cart.model.js";

const cartRouter = express.Router();

cartRouter.post("/add", addToCart);

cartRouter.get("/:userId", getCart);

cartRouter.delete("/remove/product/:productId/:userId", deleteProductFromCart);

cartRouter.delete("/remove/:userId", removeCart);

cartRouter.put("/increment/:productId/:userId", cartIncrement);

cartRouter.put("/decrement/:productId/:userId", cartDecrement);

cartRouter.post("/sync", syncCart);

export default cartRouter;
