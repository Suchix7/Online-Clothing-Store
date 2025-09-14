import React, { useState, useEffect } from "react";
import { FaTimes } from "react-icons/fa";
import { Link } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore.js";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axiosInstance.js";

const Cart = () => {
  const { authUser } = useAuthStore();
  const [cartItems, setCartItems] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [productStocks, setProductStocks] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handleResize = () => {
      loadCart();
    };

    window.addEventListener("resize", handleResize);

    // Clean up the event listener on unmount
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []); // empty dependency array ensures it runs only once on mount

  const loadCart = async () => {
    setIsLoading(true);
    if (authUser) {
      try {
        const response = await axiosInstance.get(`/cart/${authUser._id}`);
        if (response.data.products.length > 0) {
          await fetchProductStocks(response.data.products);
        }
        setCartItems(response.data.products);
        calculateTotal(response.data.products);
        setIsLoading(false);
      } catch (error) {
        console.error("Error loading cart:", error);
        setCartItems([]);
        calculateTotal([]);
        toast.error("Failed to load cart");
        setIsLoading(false);
      }
    } else {
      try {
        const cartData = localStorage.getItem("cart");
        const parsedCart = cartData ? JSON.parse(cartData) : [];
        const cartItemsArray = Array.isArray(parsedCart)
          ? parsedCart
          : Object.values(parsedCart || {});

        setCartItems(cartItemsArray);
        calculateTotal(cartItemsArray);

        if (cartItemsArray.length > 0) {
          await fetchProductStocks(cartItemsArray);
        }
      } catch (error) {
        console.error("Error loading cart:", error);
        setCartItems([]);
        calculateTotal([]);
        toast.error("Failed to load cart");
      } finally {
        setIsLoading(false);
      }
    }
  };
  useEffect(() => {
    loadCart();
  }, [authUser]);

  const fetchProductStocks = async (cartItems) => {
    try {
      const productIds = cartItems.map((item) => item.productId);
      if (productIds.length === 0) return;

      const response = await axiosInstance.get("/product/", {
        params: { productIds: productIds.join(",") },
      });

      const stocks = {};
      response.data.forEach((product) => {
        stocks[product._id] = product.stock;
      });

      setProductStocks(stocks);
    } catch (error) {
      console.error("Error fetching product stocks:", error);
      toast.error("Could not verify product availability");
    }
  };

  const calculateTotal = (items) => {
    const total = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    setTotalAmount(total);
  };

  const updateCart = (newCartItems) => {
    setCartItems(newCartItems);
    localStorage.setItem("cart", JSON.stringify(newCartItems));
    window.dispatchEvent(new Event("cartUpdated"));
    calculateTotal(newCartItems);
  };

  const sanitize = (str) =>
    String(str || "none")
      .trim()
      .replace(/[^a-zA-Z0-9-_]/g, "_");

  const handleQuantityChange = async (item, action) => {
    const { productId, color, variant, model, quantity, size } = item;
    const availableStock = productStocks[productId] || 0;

    if (authUser) {
      try {
        // Prevent illegal operations
        if (action === "decrease" && quantity <= 1) {
          toast.error("Quantity cannot be less than 1");
          return;
        }
        if (action === "increase" && quantity >= availableStock) {
          toast.error(`Only ${availableStock} items available in stock`);
          return;
        }

        const updatedItems = cartItems.map((cartItem) => {
          if (
            cartItem.productId === productId &&
            cartItem.color === color &&
            cartItem.variant === variant &&
            cartItem.model === model &&
            cartItem.size === size
          ) {
            const newQuantity =
              action === "increase"
                ? cartItem.quantity + 1
                : cartItem.quantity - 1;

            return { ...cartItem, quantity: newQuantity };
          }
          return cartItem;
        });

        setCartItems(updatedItems);
        calculateTotal(updatedItems);
        const endpoint =
          action === "increase"
            ? `/cart/increment/${productId}/${authUser._id}`
            : `/cart/decrement/${productId}/${authUser._id}`;

        await axiosInstance.put(endpoint, {
          color,
          variant,
          model,
          size,
        });

        toast.success(
          `Quantity ${action === "increase" ? "increased" : "decreased"}`
        );
      } catch (error) {
        console.error("Error while updating quantity", error);
        toast.error("Failed to update quantity");
        loadCart(); // fallback reload
      }
    } else {
      const updatedItems = cartItems.map((cartItem) => {
        if (
          cartItem.productId === productId &&
          cartItem.color === color &&
          cartItem.variant === variant &&
          cartItem.model === model
        ) {
          const currentQuantity = cartItem.quantity;

          if (action === "decrease" && currentQuantity <= 1) {
            toast.error("Quantity cannot be less than 1");
            return cartItem;
          }

          const newQuantity =
            action === "increase" ? currentQuantity + 1 : currentQuantity - 1;

          if (action === "increase" && newQuantity > availableStock) {
            toast.error(`Only ${availableStock} items available in stock`);
            return cartItem;
          }

          return { ...cartItem, quantity: newQuantity };
        }
        return cartItem;
      });

      updateCart(updatedItems);
    }
  };

  const handleRemoveItem = async (productId, color, variant, model, size) => {
    setIsLoading(true);
    if (authUser) {
      try {
        const filteredItems = cartItems.filter(
          (item) =>
            !(
              String(item.productId) == String(productId) &&
              item.color == color &&
              item.variant == variant &&
              item.model == model &&
              item.size == size
            )
        );
        updateCart(filteredItems);
        const response = await axiosInstance.delete(
          `/cart/remove/product/${productId}/${authUser._id}`,
          { data: { color, variant, model, size } }
        );
        toast.success("Item removed from cart");
        loadCart();
      } catch (error) {
        console.log(error);
        toast.error("Failed to remove item from cart");
      } finally {
        setIsLoading(false);
      }
    } else {
      const filteredItems = cartItems.filter(
        (item) =>
          !(
            String(item.productId) == String(productId) &&
            item.color == color &&
            item.variant == variant &&
            item.model == model
          )
      );
      updateCart(filteredItems);

      // Remove from productStocks state if needed
      const newStocks = { ...productStocks };
      delete newStocks[productId];
      setProductStocks(newStocks);

      toast.success("Item removed from cart");
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-10 text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-700 animate-pulse">
          Loading your cart...
        </h1>
      </div>
    );
  }

  if (cartItems.length === 0 && !isLoading) {
    return (
      <div className="container mx-auto px-4 py-10 text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-700">
          Your Cart is Empty
        </h1>
        <Link
          to="/"
          className="mt-4 inline-block bg-black text-white px-6 py-2 rounded-md hover:bg-gray-800 transition-colors"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-2 sm:px-4 py-4">
      <h1 className="text-xl sm:text-2xl font-bold text-center text-gray-800 mb-4 sm:mb-6">
        Your Shopping Cart
      </h1>

      {/* Mobile View */}
      <div className="sm:hidden space-y-4">
        {cartItems.map((item) => {
          const availableStock = productStocks[item.productId] || 0;
          const isMaxQuantity = item.quantity >= availableStock;

          return (
            <div
              key={`${item.productId}-${item.quantity}-${item.price}`}
              className="bg-white p-3 rounded-lg shadow-sm border border-gray-200"
            >
              <div className="flex justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-16 h-16 object-contain rounded-md border border-gray-300"
                  />
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-800 line-clamp-2">
                      {item.name} {item.color && `(${item.color})`}
                    </h3>
                    <p className="text-sm font-semibold text-gray-800 mt-1">
                      $ {item.price}
                    </p>
                    {availableStock > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        {availableStock} available in stock
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() =>
                    handleRemoveItem(
                      item.productId,
                      item.color,
                      item.variant,
                      item.model,
                      item.size
                    )
                  }
                  className="text-gray-400 hover:text-red-500 ml-2"
                  aria-label="Remove item"
                >
                  <FaTimes size={16} />
                </button>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => handleQuantityChange(item, "decrease")}
                    className="w-8 h-8 flex items-center justify-center bg-red-500 rounded-full text-white hover:bg-red-600 transition-colors"
                    aria-label="Decrease quantity"
                  >
                    -
                  </button>
                  <span
                    className="w-8 text-center font-medium"
                    id={`quantity-${item.productId}-${sanitize(
                      item.color
                    )}-${sanitize(item.variant)}-${sanitize(item.model)}`}
                  >
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => handleQuantityChange(item, "increase")}
                    disabled={isMaxQuantity}
                    className={`w-8 h-8 flex items-center justify-center rounded-full text-white transition-colors ${
                      isMaxQuantity
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-gray-800 hover:bg-gray-700"
                    }`}
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
                <p className="text-sm font-semibold">
                  $ {(item.price * item.quantity).toFixed(2)}
                </p>
              </div>
            </div>
          );
        })}

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex justify-between items-center">
            <span className="font-semibold">Total</span>
            <span className="font-semibold text-lg">
              $ {totalAmount.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Desktop View */}
      <div className="hidden sm:block bg-white shadow-md rounded-lg p-4">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="bg-black text-white">
              <th className="py-3 px-4">Product</th>
              <th className="py-3 px-4">Price</th>
              <th className="py-3 px-4">Quantity</th>
              <th className="py-3 px-4">Color</th>
              <th className="py-3 px-4">Size</th>
              <th className="py-3 px-4">Total</th>
              <th className="py-3 px-4 text-center">Remove</th>
            </tr>
          </thead>
          <tbody>
            {cartItems.map((item) => {
              const availableStock = productStocks[item.productId] || 0;
              const isMaxQuantity = item.quantity >= availableStock;
              return (
                <tr
                  key={`${item.productId}-${item.quantity}`}
                  className="border-b hover:bg-gray-50"
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-4">
                      <Link
                        to={`/products/${item.modelName}`}
                        className="block w-16"
                      >
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-16 h-16 object-contain rounded-md border border-gray-300"
                        />
                      </Link>
                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-gray-800 line-clamp-2">
                          {item.name}
                        </span>
                        {availableStock > 0 && (
                          <p className="text-xs text-gray-500 mt-1">
                            {availableStock} available in stock
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-4 text-gray-700">
                    $ {item.price.toFixed(2)}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => handleQuantityChange(item, "decrease")}
                        className="w-8 h-8 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors flex items-center justify-center"
                        aria-label="Decrease quantity"
                      >
                        -
                      </button>
                      <span
                        className="font-medium"
                        id={`quantity-${item.productId}-${sanitize(
                          item.color
                        )}-${sanitize(item.variant)}-${sanitize(item.model)}`}
                      >
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleQuantityChange(item, "increase")}
                        disabled={isMaxQuantity}
                        className={`w-8 h-8 rounded-full text-white flex items-center justify-center transition-colors ${
                          isMaxQuantity
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-black hover:bg-gray-800"
                        }`}
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-700">
                    {item.color || "No color chosen"}
                  </td>
                  <td className="py-3 px-4 text-gray-700">
                    {item.size || "No variant chosen"}
                  </td>

                  <td className="py-3 px-4 text-gray-700">
                    $ {(item.price * item.quantity).toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() =>
                        handleRemoveItem(
                          item.productId,
                          item.color,
                          item.variant,
                          item.model,
                          item.size
                        )
                      }
                      className="text-red-500 hover:text-red-700 transition-colors"
                      aria-label="Remove item"
                    >
                      <FaTimes size={18} />
                    </button>
                  </td>
                </tr>
              );
            })}
            <tr className="bg-gray-100">
              <td className="py-3 px-4 font-semibold" colSpan={6}>
                Total
              </td>
              <td className="py-3 px-4 font-semibold text-lg">
                $ {totalAmount.toFixed(2)}
              </td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Action Buttons */}
      <div className="mt-6 flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
        <Link
          to="/"
          className="px-4 py-3 text-center border border-black text-black rounded-lg hover:bg-gray-50 transition-colors"
        >
          Continue Shopping
        </Link>
        <Link
          to="/checkout"
          className="px-4 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-center"
        >
          Proceed to Checkout
        </Link>
      </div>
    </div>
  );
};

export default Cart;
