import { useState, useEffect } from "react";
import { Heart, ShoppingCart, Star } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore.js";
import { axiosInstance } from "../lib/axiosInstance.js";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

function Button({
  className,
  variant = "default",
  size = "default",
  children,
  ...props
}) {
  const baseStyles =
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-white transition-opacity transition-transform transition-colors duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-600 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0";

  const variants = {
    default: "bg-black text-white hover:bg-gray-800",
    destructive: "bg-red-600 text-white hover:bg-red-500",
    outline: "border border-gray-300 bg-white hover:bg-gray-100 text-black",
    secondary: "bg-gray-200 text-black hover:bg-gray-300",
    ghost: "hover:bg-gray-100 text-black",
    link: "text-black underline-offset-4 hover:underline",
  };

  const sizes = {
    default: "h-10 px-4 py-2",
    sm: "h-9 rounded-md px-3",
    lg: "h-11 rounded-md px-8",
    icon: "h-10 w-10",
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${
        className || ""
      }`}
      {...props}
    >
      {children}
    </button>
  );
}

function ProductCard({
  id,
  modelName,
  image,
  title,
  price,
  originalPrice,
  rating,
  reviews,
  stock,
  className,
  delay = 0,
}) {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [cartLoading, setCartLoading] = useState(false);
  const { authUser } = useAuthStore();
  const addToCart = async () => {
    setCartLoading(true);
    if (authUser) {
      try {
        const response = await axiosInstance.post("/cart/add", {
          userId: authUser._id,
          productId: id,
          modelName: modelName,
          name: title,
          price: price,
          quantity: quantity,
          image: image,
          stock: stock,
          color: "No color chosen",
          variant: "No variant chosen",
          model: "No model chosen",
        });
        toast.success(response.data.message);
        setQuantity(1);
        setCartLoading(false);
      } catch (error) {
        console.error("Error adding to cart:", error);
        toast.error("Failed to add to cart");
        setCartLoading(false);
      }
    } else {
      const updatedCartItem = {
        productId: id,
        modelName: modelName,
        name: title,
        price: price,
        quantity: quantity,
        image: image,
        stock: stock,
        color: "No color chosen",
        variant: "No variant chosen",
        model: "No model chosen",
      };

      const checkCart = localStorage.getItem("cart");
      const cart = checkCart ? JSON.parse(checkCart) : [];
      const existingItemIndex = cart.findIndex(
        (item) =>
          item.productId === updatedCartItem.productId &&
          item.modelName === updatedCartItem.modelName &&
          item.variant === updatedCartItem.variant &&
          item.color === updatedCartItem.color &&
          item.model === updatedCartItem.model
      );

      if (existingItemIndex !== -1) {
        const newQuantity = cart[existingItemIndex].quantity + quantity;
        if (newQuantity > stock) {
          toast.error(`Cannot add more than available stock (${stock})`);
          return;
        }
        cart[existingItemIndex].quantity = newQuantity;
        toast.success("Product quantity updated in cart");
        setCartLoading(false);
      } else {
        cart.push(updatedCartItem);
        toast.success("Product added to cart");
        setCartLoading(false);
      }

      localStorage.setItem("cart", JSON.stringify(cart));
      setQuantity(1);
    }
  };

  const discount = originalPrice
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;

  return (
    <motion.div
      className={`group relative overflow-hidden rounded-xl bg-white border border-gray-200 shadow hover:shadow-lg transition-all duration-300 ease-out hover:scale-[1.02] hover:-translate-y-1 ${
        className || ""
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2, margin: "0px 0px -100px 0px" }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {/* Discount Badge */}
      {discount > 0 && (
        <div className="absolute top-3 left-3 z-10 bg-black text-white text-xs font-semibold px-2 py-1 rounded-full shadow">
          -{discount}%
        </div>
      )}
      <Link to={`/products/${modelName?.replace(/\s+/g, "-")}`}>
        {/* Product Image */}
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          <img
            src={image}
            alt={title}
            className={`h-full w-full object-cover transition-transform duration-500 ${
              isHovered ? "scale-110" : ""
            }`}
          />

          {/* Overlay */}
          <div
            className={`absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 transition-opacity duration-300 ${
              isHovered ? "opacity-100" : ""
            }`}
          />
        </div>
      </Link>
      {/* Product Info */}
      <div className="p-4 space-y-3">
        {/* Title */}
        <Link
          to={`/products/${modelName?.replace(/\s+/g, "-")}`}
          className="space-y-3 mb-3"
        >
          <h3 className="font-semibold text-sm leading-tight text-black group-hover:text-gray-800 transition-colors duration-200 line-clamp-2">
            {title}
          </h3>

          {/* Rating */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-3 w-3 ${
                    i < Math.floor(rating)
                      ? "fill-black text-black"
                      : "text-gray-300"
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-gray-500">({reviews})</span>
          </div>

          {/* Price */}
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-black">
              ${price.toFixed(2)}
            </span>
            {originalPrice && (
              <span className="text-sm text-gray-500 line-through">
                ${originalPrice.toFixed(2)}
              </span>
            )}
          </div>
        </Link>
        {/* Add to Cart Button */}
        <Button
          className="w-full bg-black text-white hover:bg-gray-800 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 cursor-pointer mt-3"
          onClick={() => {
            addToCart();
          }}
        >
          <ShoppingCart className="h-4 w-4 mr-2" />
          Add to Cart
        </Button>
      </div>
    </motion.div>
  );
}

export default function RecommendedProducts() {
  const [showAll, setShowAll] = useState(false);
  const { authUser } = useAuthStore();
  const [products, setProducts] = useState([]);

  const fetchProducts = async () => {
    try {
      const response = await axiosInstance.get(
        `/reco/personalized/${authUser._id}`
      );
      setProducts(response.data.items);
    } catch (error) {
      console.error("Error fetching recommended products:", error);
    }
  };

  useEffect(() => {
    if (authUser?._id) {
      fetchProducts();
    }
  }, []);

  const visibleProducts = showAll ? products : products.slice(0, 4);

  if (visibleProducts.length === 0) {
    return null;
  }

  return (
    <section className="py-16 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 border border-gray-300 mb-4">
            <span className="text-sm font-medium text-gray-500">
              Curated for you
            </span>
          </div>

          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="text-black">Recommended</span>{" "}
            <span className="text-gray-700">Products</span>
          </h2>

          <p className="text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
            Discover our handpicked selection of premium tech products,
            carefully chosen to match your style and needs.
          </p>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {visibleProducts.length > 0 &&
            visibleProducts.map((product, index) => (
              <div
                key={product._id ?? product.id ?? index}
                className="animate-in fade-in slide-in-from-bottom-4 duration-700"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <ProductCard
                  id={product._id ?? product.id ?? String(index)}
                  image={
                    product?.images?.[0]?.url ||
                    product?.image ||
                    "/placeholder.png"
                  }
                  modelName={product.modelName}
                  title={product.name}
                  price={Number(product.sellingPrice ?? product.price ?? 0)}
                  originalPrice={
                    product.originalPrice != null
                      ? Number(product.originalPrice)
                      : undefined
                  }
                  rating={Number(product.rating ?? 0)}
                  reviews={
                    typeof product.reviews === "number"
                      ? product.reviews
                      : Array.isArray(product.reviews)
                      ? product.reviews.length
                      : Number(product.reviewsCount ?? 0)
                  }
                  stock={product.stock ?? 0}
                  delay={index * 0.25}
                />
              </div>
            ))}
        </div>

        {/* View All / View Less Button */}
        {/* {products.length > 4 && (
          <div className="text-center mt-12">
            <button
              className="group relative overflow-hidden rounded-full bg-black px-8 py-4 text-white font-medium shadow hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer"
              onClick={() => setShowAll((v) => !v)}
              aria-expanded={showAll}
            >
              <span className="relative z-10">
                {showAll ? "View Less" : "View All Products"}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            </button>
          </div>
        )} */}
      </div>
    </section>
  );
}
