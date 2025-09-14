import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FiHeart,
  FiShoppingCart,
  FiTrash2,
  FiArrowRight,
} from "react-icons/fi";
import Navbar from "../components/Navbar";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore.js";
import { axiosInstance } from "../lib/axiosInstance.js";

const WishlistPage = () => {
  const navigate = useNavigate();
  const { authUser } = useAuthStore();
  const [loading, setLoading] = useState(false);

  // Initialize wishlist state safely from localStorage
  const [wishlist, setWishlist] = useState(() => {
    try {
      const stored = localStorage.getItem("wishlist");
      if (!stored || stored === "undefined") return [];
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      console.error("Error reading wishlist from localStorage:", err);
      return [];
    }
  });

  // Fetch wishlist from server if authenticated
  const fetchWishlist = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/wishlist/${authUser?._id}`);
      const data = res.data?.wishlist?.products;
      setWishlist(Array.isArray(data) ? data : []);
    } catch (error) {
      console.log("Error while fetching wishlist:", error);
    } finally {
      setLoading(false);
    }
  };

  // On auth change, load wishlist accordingly
  useEffect(() => {
    if (authUser) {
      fetchWishlist();
    } else {
      try {
        setLoading(true);
        const storedList = localStorage.getItem("wishlist");
        if (!storedList || storedList === "undefined") {
          setWishlist([]);
        } else {
          const parsed = JSON.parse(storedList);
          setWishlist(Array.isArray(parsed) ? parsed : []);
        }
      } catch (error) {
        console.error("Error parsing wishlist from localStorage:", error);
        setWishlist([]);
      } finally {
        setLoading(false);
      }
    }
  }, [authUser?._id]);

  // Save wishlist to localStorage on change
  useEffect(() => {
    if (Array.isArray(wishlist)) {
      localStorage.setItem("wishlist", JSON.stringify(wishlist));
    } else {
      console.warn("Wishlist is not an array. Skipping localStorage update.");
    }
  }, [wishlist]);

  const removeFromWishlist = async (id) => {
    if (authUser) {
      try {
        const response = await axiosInstance.delete(
          `/wishlist/${authUser?._id}/${id}`
        );
        const updatedWishlist = wishlist.filter((item) => item.id !== id);
        setWishlist(updatedWishlist);
        toast.success("Item removed from wishlist");
        fetchWishlist();
      } catch (error) {
        console.log("Error while removing from wishlist:", error);
        toast.error("Failed to remove from wishlist");
        fetchWishlist();
      }
    } else {
      try {
        const updatedWishlist = wishlist.filter(
          (item) => item.productId !== id
        );
        setWishlist(updatedWishlist);
        toast.success("Item removed from wishlist");
      } catch (err) {
        console.log("Error while removing from wishlist:", err);
      }
    }
  };

  const addToCart = async (id) => {
    if (authUser) {
      try {
        const res = await axiosInstance.get(`/product/${id}`);
        const product = res.data;
        console.log(product);
        const response = await axiosInstance.post("/cart/add", {
          userId: authUser._id,
          productId: product._id,
          name: product.name,
          price: product.sellingPrice,
          quantity: 1,
          image: product.images[0]?.url,
          stock: product.stock,
          size: "No size chosen",
          color: "No color chosen",
          variant: "No variant chosen",
          model: "No model chosen",
        });
        toast.success(response.data.message);
      } catch (error) {
        console.error("Error adding to cart:", error);
        toast.error("Failed to add to cart");
      }
    }
  };

  const addAllToCart = () => {
    if (authUser) {
      wishlist.forEach((item) => {
        console.log(item);
        addToCart(item.productId);
      });
    } else {
      const checkCart = localStorage.getItem("cart");
      const existingCart = checkCart ? JSON.parse(checkCart) : [];

      // Use a Set to track existing product IDs for duplicate check
      const cartIds = new Set(existingCart.map((item) => item.productId));

      wishlist.forEach((item) => {
        if (!cartIds.has(item.id)) {
          const cartItem = {
            productId: item.productId,
            name: item.name,
            price: item.price,
            quantity: 1,
            image: item.image,
            stock: item.inStock,
          };
          existingCart.push(cartItem);
        }
      });

      localStorage.setItem("cart", JSON.stringify(existingCart));
      toast.success("All wishlist items added to cart");
    }
  };

  const continueShopping = () => {
    addAllToCart();
    navigate("/checkout");
  };

  return (
    <div className="min-h-[900px] bg-gray-100">
      {/* Header */}
      <Navbar />

      {/* Main Content */}
      <main className="max-w-[1620px] mx-auto py-8 px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Page Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold">Your Wishlist</h1>
              <p className="text-gray-600">
                {wishlist?.length} {wishlist?.length === 1 ? "item" : "items"}
              </p>
            </div>
            {wishlist?.length > 0 && (
              <button
                className="mt-4 md:mt-0 flex items-center space-x-2 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                onClick={continueShopping}
              >
                <span>Continue Shopping</span>
                <FiArrowRight className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Wishlist Items */}
          {loading ? (
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <div className="mx-auto w-24 h-24 rounded-full bg-pink-100 flex items-center justify-center mb-6">
                <FiHeart className="w-12 h-12 text-pink-500" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Loading...</h2>
            </div>
          ) : wishlist?.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <div className="mx-auto w-24 h-24 rounded-full bg-pink-100 flex items-center justify-center mb-6">
                <FiHeart className="w-12 h-12 text-pink-500" />
              </div>
              <h2 className="text-2xl font-bold mb-2">
                Your wishlist is empty
              </h2>
              <p className="text-gray-600 mb-6">
                Save your favorite items here for later
              </p>
              <Link to="/products">
                <button className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors">
                  Start Shopping
                </button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {wishlist?.map((item) => (
                <motion.div
                  key={item.id}
                  whileHover={{ y: -5 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200 relative"
                >
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        removeFromWishlist(item.productId);
                      }}
                      className="absolute top-4 right-4 z-10 p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors"
                    >
                      <FiHeart className="w-5 h-5 text-pink-500 fill-pink-500" />
                    </button>

                    <Link to={`/products/${item.id}`}>
                      {/* Product Image */}
                      <div className="h-48 bg-gray-100 flex items-center justify-center p-4">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>

                      {/* Product Info */}
                      <div className="p-6">
                        <h3 className="font-bold text-lg mb-1">{item.name}</h3>
                        <p className="text-gray-900 font-medium mb-4">
                          ${item.price}
                        </p>

                        {/* Stock Status */}
                        <div className="flex items-center mb-4">
                          <span
                            className={`w-2 h-2 rounded-full mr-2 ${
                              item.inStock ? "bg-green-500" : "bg-red-500"
                            }`}
                          ></span>
                          <span className="text-sm">
                            {item.inStock ? "In Stock" : "Out of Stock"}
                          </span>
                        </div>
                      </div>
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Bottom CTA */}
          {wishlist?.length > 0 && (
            <div className="mt-12 flex flex-col sm:flex-row justify-between items-center bg-white rounded-xl shadow-md p-6">
              <div>
                <h3 className="font-bold text-lg mb-1">
                  Ready to purchase your wishlist?
                </h3>
                <p className="text-gray-600">
                  Add all available items to your cart
                </p>
              </div>
              <button
                className="mt-4 sm:mt-0 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center space-x-2"
                onClick={addAllToCart}
              >
                <FiShoppingCart className="w-5 h-5" />
                <span>Add All to Cart ({wishlist?.length} items)</span>
              </button>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default WishlistPage;
