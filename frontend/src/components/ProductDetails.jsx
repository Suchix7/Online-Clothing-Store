import { useState, useEffect, useRef, useCallback, act } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
// Shared cache for scroll position and products (module-level, sync with Products.jsx)
let cachedScrollY = 0;
import Navbar from "../components/Navbar";
import { axiosInstance } from "../lib/axiosInstance";
import { useAuthStore } from "../store/useAuthStore.js";
import toast from "react-hot-toast";
import { FiUser, FiZoomIn, FiZoomOut } from "react-icons/fi";
import {
  FaHeart,
  FaRegHeart,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import SvgLoader from "./SvgLoader.jsx";
import {
  Check,
  CheckCheck,
  CircleCheckBig,
  Loader,
  Shield,
  Truck,
  BadgeCheck,
  Headset,
  Tag,
  Star,
  ShoppingCart,
  Heart,
  Verified,
} from "lucide-react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

const slideVariants = {
  enter: (dir) => ({ x: dir * 300, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir) => ({ x: dir * -300, opacity: 0 }),
};

function useSwipe({ onSwipeLeft, onSwipeRight, threshold = 60 }) {
  const startX = useRef(0);
  const isDown = useRef(false);
  const moved = useRef(false);

  const onPointerDown = useCallback((e) => {
    const x = e.clientX ?? 0; // PointerEvent always has clientX
    startX.current = x;
    isDown.current = true;
    moved.current = false;
    e.currentTarget.setPointerCapture?.(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e) => {
    if (!isDown.current) return;
    const x = e.clientX ?? 0;
    if (Math.abs(x - startX.current) > 5) moved.current = true;
  }, []);

  const onPointerUp = useCallback(
    (e) => {
      if (!isDown.current) return;
      const x = e.clientX ?? 0;
      const dx = x - startX.current;
      isDown.current = false;

      if (!moved.current) return;
      if (Math.abs(dx) < threshold) return;

      if (dx < 0) onSwipeLeft?.();
      else onSwipeRight?.();
    },
    [onSwipeLeft, onSwipeRight, threshold]
  );

  const onPointerCancel = useCallback(() => {
    isDown.current = false;
  }, []);
  const onPointerLeave = useCallback(() => {
    isDown.current = false;
  }, []);

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
    onPointerLeave,
  };
}

const StarRating = ({
  rating,
  setRating,
  hover,
  setHover,
  interactive = true,
}) => {
  const getStarType = (star) => {
    const activeValue = hover || rating;
    if (activeValue >= star) return "full";
    if (activeValue >= star - 0.5) return "half";
    return "empty";
  };

  return (
    <div className="flex">
      {[1, 2, 3, 4, 5].map((star) => {
        const type = getStarType(star);
        return (
          <button
            key={star}
            type="button"
            className={`relative w-6 h-6 ${
              interactive ? "cursor-pointer" : "cursor-default"
            } focus:outline-none`}
            onMouseEnter={() => interactive && setHover(star)}
            onMouseLeave={() => interactive && setHover(0)}
            onClick={() => interactive && setRating(star)}
          >
            {/* Full or Half Star Fill */}
            {type !== "empty" && (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                className={`w-6 h-6 absolute transition-all duration-150 ${
                  type === "full"
                    ? "opacity-100 scale-110"
                    : "opacity-90 scale-105"
                }`}
                fill="currentColor"
                stroke="currentColor"
                strokeWidth="1"
              >
                <defs>
                  <linearGradient
                    id={`half-${star}`}
                    x1="0"
                    x2="100%"
                    y1="0"
                    y2="0"
                  >
                    <stop offset="50%" stopColor="#facc15" /> {/* yellow-500 */}
                    <stop offset="50%" stopColor="#d1d5db" /> {/* gray-300 */}
                  </linearGradient>
                </defs>
                <path
                  d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
                  className={
                    type === "full"
                      ? "fill-yellow-500 stroke-yellow-600"
                      : "stroke-yellow-600"
                  }
                  fill={type === "half" ? `url(#half-${star})` : undefined}
                />
              </svg>
            )}

            {/* Base Outline Star */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
            >
              <path
                d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
                className="stroke-gray-300"
              />
            </svg>
          </button>
        );
      })}
    </div>
  );
};

const ProductDetails = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { modelName } = useParams();
  const { authUser } = useAuthStore();
  const [product, setProduct] = useState(null);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cart, setCart] = useState({});
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [reviews, setReviews] = useState([]);
  const [hover, setHover] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [color, setColor] = useState("");
  const [Wishlistclicked, WishlistsetClicked] = useState(false);
  const [activeColor, setActiveColor] = useState("No color chosen");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
  const [activeStorage, setActiveStorage] = useState("No variant chosen");
  const [variantPrice, setVariantPrice] = useState(0);
  const [bundlePrice, setBundlePrice] = useState(0);
  const [model, setModel] = useState(null);
  const [totalRating, setTotalRating] = useState(0);
  const [mediaFiles, setMediaFiles] = useState([]);
  const [mediaPreview, setMediaPreview] = useState([]);
  const [uploadError, setUploadError] = useState("");
  const [deletingReviews, setDeletingReviews] = useState(new Set());
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [cartLoading, setCartLoading] = useState(false);
  const [heartLoading, setHeartLoading] = useState(false);
  const [selectedPack, setSelectedPack] = useState("1x");
  const [selectedModel, setSelectedModel] = useState(null);
  const [direction, setDirection] = useState(0);
  const [activeSize, setActiveSize] = useState(null);
  const SWIPE_OFFSET_TRIGGER = 80; // px the user must drag before we flip
  const SWIPE_VELOCITY_TRIGGER = 600; // px/s fling speed

  const nextImage = () => {
    setDirection(1); // moving left to show the next
    setCurrentImageIndex((prev) =>
      prev === product?.images?.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = () => {
    setDirection(-1); // moving right to show the prev
    setCurrentImageIndex((prev) =>
      prev === 0 ? product?.images?.length - 1 : prev - 1
    );
  };

  const handleDragEnd = useCallback(
    (event, info) => {
      const { offset, velocity } = info;
      const traveled = offset.x;
      const speed = velocity.x;

      // Don’t swipe while zoomed; just snap back
      if (isZoomed) return;

      // If color view is active, a swipe exits color mode for continuity
      if (color) {
        if (
          traveled < -SWIPE_OFFSET_TRIGGER ||
          speed < -SWIPE_VELOCITY_TRIGGER
        ) {
          setColor("");
          setDirection(-1);
          if (product?.images?.length > 1) nextImage();
          return;
        }
        if (traveled > SWIPE_OFFSET_TRIGGER || speed > SWIPE_VELOCITY_TRIGGER) {
          setColor("");
          setDirection(1);
          if (product?.images?.length > 1) prevImage();
          return;
        }
        return; // snap back
      }

      // Normal gallery
      if (traveled < -SWIPE_OFFSET_TRIGGER || speed < -SWIPE_VELOCITY_TRIGGER) {
        nextImage();
      } else if (
        traveled > SWIPE_OFFSET_TRIGGER ||
        speed > SWIPE_VELOCITY_TRIGGER
      ) {
        prevImage();
      }
    },
    [
      isZoomed,
      color,
      product?.images?.length,
      nextImage,
      prevImage,
      SWIPE_OFFSET_TRIGGER,
      SWIPE_VELOCITY_TRIGGER,
    ]
  );

  useEffect(() => {
    const matchedModel = sessionStorage.getItem("matchedModel");

    if (matchedModel && product?.model?.length > 0) {
      const matchedModels = product.model
        .filter((m) => matchedModel.toLowerCase().includes(m.toLowerCase()))
        .sort((a, b) => b.length - a.length); // longest match first

      const matched = matchedModels[0];
      456;

      if (matched) {
        setModel(matched);
      }
      if (matched) {
        setModel(matched);
        sessionStorage.removeItem("matchedModel");
      }
    }
  }, [product]);

  // inside your component:
  const {
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
    onPointerLeave,
  } = useSwipe({
    onSwipeLeft: () => {
      if (color) setColor(""); // exit single-color image mode
      if (product.images?.length > 1) nextImage();
    },
    onSwipeRight: () => {
      if (color) setColor("");
      if (product.images?.length > 1) prevImage();
    },
    threshold: 60,
  });
  const validateSelections = () => {
    const errors = [];

    // Color selection
    if (
      product.color?.length > 0 &&
      (!activeColor || activeColor === "No color chosen")
    ) {
      errors.push("color");
    }

    // Model selection
    if (product.model?.length > 0 && (!model || model === "No model chosen")) {
      errors.push("model");
    }
    //Size Selection
    if (product.size?.length > 0 && !activeSize) {
      errors.push("size");
    }
    // Variant selection
    if (
      product.variant?.length > 0 &&
      (!activeStorage || activeStorage === "No variant chosen")
    ) {
      errors.push("variant");
    }

    // Quantity pack for Screen Protectors
    if (
      product.parentCategory === "Screen Protector" &&
      (!selectedPack || selectedPack === "")
    ) {
      errors.push("quantity pack");
    }

    return errors;
  };

  const toggleZoom = (e) => {
    e.stopPropagation(); // don’t let this start a drag/swipe
    setIsZoomed((z) => !z);
  };

  const features = [
    {
      icon: <Truck className="w-5 h-5 text-pink-600" />,
      text: "Fast Nationwide Shipping",
    },
    {
      icon: <BadgeCheck className="w-5 h-5 text-pink-600" />,
      text: "Authentic Products with Manufacturer Warranty",
    },
    {
      icon: <Headset className="w-5 h-5 text-pink-600" />,
      text: "Dedicated Customer Support",
    },
    {
      icon: <Tag className="w-5 h-5 text-pink-600" />,
      text: "Competitive Pricing",
    },
  ];
  // Back button handler
  const handleBack = () => {
    if (location.state?.fromProductsPage) {
      // Set the flags for Products.jsx to use cached data
      window.productsPageState = window.productsPageState || {};
      window.productsPageState.isBackNavigation = true;
      window.productsPageState.isProductClick = false;
      navigate(-1);
      return;
    }

    if (location.state?.fromTopBrandsPage) {
      window.topBrandsPageState = window.topBrandsPageState || {};
      window.topBrandsPageState.isBackNavigation = true;
      navigate(-1);
      return;
    }

    // Default case - navigate to products page
    navigate("/products");
  };

  // Effect to handle navigation state
  useEffect(() => {
    // Initialize global state if needed
    window.productsPageState = window.productsPageState || {};
    window.topBrandsPageState = window.topBrandsPageState || {};

    // Set appropriate flags based on navigation source
    if (location.state?.fromProductsPage) {
      window.productsPageState.isBackNavigation = true;
      window.productsPageState.isProductClick = false;
    } else if (location.state?.fromTopBrandsPage) {
      window.topBrandsPageState.isBackNavigation = true;
    }

    // Cleanup function
    return () => {
      // Reset flags only if we're not going back to the source page
      if (!location.state?.fromProductsPage) {
        window.productsPageState.isBackNavigation = false;
        window.productsPageState.isProductClick = false;
      }
      if (!location.state?.fromTopBrandsPage) {
        window.topBrandsPageState.isBackNavigation = false;
      }
    };
  }, [location.state]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/product/${modelName}`);

      const productData = {
        ...response.data,
        id: response.data._id,
        modelName: response.data.modelName,
        image: response.data.images[0]?.url,
        price: response.data.sellingPrice,
      };
      setProduct(productData);
      setLoading(false);
      // const similarResponse = await axiosInstance.get(
      //   `/products/similar/${productData.parentCategory}`
      // );
      const similarItems = await axiosInstance.get(
        `/reco/similar/${productData._id}`
      );

      const similarProductsData = similarItems.data.items.map((item) => ({
        ...item,
        id: item._id,
        modelName: item.modelName,
        image: item.images[0]?.url || "/placeholder-product.png",
        currentPrice: item.sellingPrice || item.price,
        color:
          item.color.length > 0
            ? item.color.flatMap((item) => item.colorName).join(", ")
            : "No color available",
        inStock: item.stock > 0,
      }));
      setSimilarProducts(similarProductsData);
      const checkRecentProduct = localStorage.getItem("recentlyViewed");
      let recentProduct = checkRecentProduct
        ? JSON.parse(checkRecentProduct)
        : [];
      const isProductInRecent = recentProduct.some(
        (item) => item._id === productData._id
      );
      if (!isProductInRecent) {
        recentProduct.push({
          _id: productData._id,
          modelName: productData.modelName,
          name: productData.name,
          images: productData.images,
          sellingPrice: productData.sellingPrice,
        });
        if (recentProduct.length > 10) {
          recentProduct.shift(); // Remove the oldest product if more than 10
        }
        localStorage.setItem("recentlyViewed", JSON.stringify(recentProduct));
      }
    } catch (err) {
      console.log("Here is the error", err);
      setError(err.response?.data?.message || err.message);
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchProduct();
  }, [modelName]);

  const fetchReviews = async () => {
    try {
      const res = await axiosInstance.get(`/review/${product._id}`);

      const data = res.data.response.filter(
        (review) => review.comment.length > 0
      );
      setReviews(data);
      setTotalRating(res.data.responseCount || 0);
    } catch (error) {
      console.log("Couldn't fetch reviews: ", error);
    }
  };

  useEffect(() => {
    try {
      const cartData = sessionStorage.getItem("cart");
      const storedData = cartData ? JSON.parse(cartData) : [];

      setCart(storedData);

      if (product?._id) {
        fetchReviews();
      }
    } catch (error) {
      console.log("Error while fetching cart data: ", error);
    }
  }, [product?._id]);

  useEffect(() => {
    const fetchWishlist = async () => {
      const response = await axiosInstance.get(`/wishlist/${authUser?._id}`);
      const data = response.data?.wishlist.products;
      const isInWishlist = data.some(
        (item) => String(item.productId) === String(product?._id)
      );
      WishlistsetClicked(isInWishlist);
    };
    if (authUser) {
      fetchWishlist();
    } else {
      const wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];
      const isInWishlist = wishlist.some((item) => item.id === product?._id);
      WishlistsetClicked(isInWishlist);
    }
  }, [product]);

  if (loading)
    return (
      <div className="flex min-h-screen justify-center items-center">
        <SvgLoader />
      </div>
    );
  if (error)
    return <div className="text-center py-8 text-red-500">Error: {error}</div>;
  if (!product)
    return <div className="text-center py-8">Product not found</div>;

  const increaseQuantity = () => {
    if (quantity < product.stock) {
      setQuantity(quantity + 1);
    }
  };

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value)) {
      if (value < 1) {
        setQuantity(1);
      } else if (value > product.stock) {
        setQuantity(product.stock);
      } else {
        setQuantity(value);
      }
    }
  };
  function handleSize(sizeName) {
    setActiveSize((prev) => (prev === sizeName ? null : sizeName));
  }

  const handleColor = (image, colorName) => {
    if (activeColor === colorName && color === image) {
      setColor("");
      setActiveColor("");
    } else {
      setColor(image);
      setActiveColor(colorName);
    }
  };

  const handleModel = (modelName) => {
    if (model === modelName) {
      setModel("");
    } else {
      setModel(modelName);
    }
  };

  const handleVariant = (variantName, price) => {
    if (activeStorage === variantName && variantPrice === price) {
      setActiveStorage("");
      setVariantPrice("");
    } else {
      setActiveStorage(variantName);
      setVariantPrice(price);
    }
  };
  const handleBundle = (price) => {
    if (bundlePrice == price) {
      setBundlePrice(0);
    } else {
      setBundlePrice(price);
    }
  };

  const handleWishlist = async () => {
    setHeartLoading(true);
    if (authUser) {
      try {
        // ✅ GET current wishlist
        const checkResponse = await axiosInstance.get(
          `/wishlist/${authUser?._id}`
        );

        const oldWishlist = checkResponse.data.wishlist?.products || [];

        // ✅ Check if product is already in wishlist
        const isInWishlist = oldWishlist.some(
          (item) => item.productId.toString() === product._id.toString()
        );

        if (!isInWishlist) {
          // ✅ Add product to wishlist
          await axiosInstance.post("/wishlist", {
            userId: authUser._id,
            productId: product._id,
            name: product.name,
            price: product.sellingPrice || product.price,
            image: product.images?.[0]?.url || product.image,
            inStock: product.stock,
          });

          toast.success("Added to wishlist");
        } else {
          // ✅ Remove product from wishlist
          await axiosInstance.delete(
            `/wishlist/${authUser?._id}/${product._id}`
          );

          toast.success("Removed from wishlist");
        }

        WishlistsetClicked(!isInWishlist);
      } catch (error) {
        console.log("Error while handling wishlist:", error);
        toast.error(error.response?.data?.message || "Something went wrong");
        WishlistsetClicked(false);
      } finally {
        setHeartLoading(false);
      }
    } else {
      // ✅ Guest user logic using localStorage
      const checkWishlist = localStorage.getItem("wishlist");
      let wishlist = checkWishlist ? JSON.parse(checkWishlist) : [];

      const wishlistItem = {
        id: product._id,
        name: product.name,
        price: product.sellingPrice || product.price,
        image: product.images?.[0]?.url || product.image,
        inStock: product.stock,
      };

      const isInWishlist = wishlist.some((item) => item.id === product._id);

      if (!isInWishlist) {
        wishlist.push(wishlistItem);
        toast.success("Added to wishlist");
      } else {
        wishlist = wishlist.filter((item) => item.id !== product._id);
        toast.success("Removed from wishlist");
      }

      localStorage.setItem("wishlist", JSON.stringify(wishlist));
      WishlistsetClicked(!isInWishlist);
      setHeartLoading(false);
    }
  };

  const addToCart = async () => {
    const validationErrors = validateSelections();

    if (validationErrors.length > 0) {
      validationErrors.forEach((field) => {
        toast.error(`Please select a ${field} before adding to cart`);
      });
      return;
    }

    setCartLoading(true);
    if (authUser) {
      try {
        const response = await axiosInstance.post("/cart/add", {
          userId: authUser._id,
          productId: product.id,
          modelName: product.modelName,
          name: product.name,
          price:
            variantPrice > 0
              ? variantPrice
              : bundlePrice > 0
              ? bundlePrice / quantity
              : product.sellingPrice,
          quantity: quantity,
          image:
            activeColor !== "No color chosen" ? color : product.images[0]?.url,
          stock: product.stock,
          color: activeColor,
          variant: activeStorage,
          size: activeSize,
          model: model,
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
        productId: product._id,
        name: product.name,
        modelName: product.modelName,
        price:
          variantPrice > 0
            ? variantPrice
            : bundlePrice > 0
            ? bundlePrice / quantity
            : product.sellingPrice,
        quantity: quantity,
        image:
          activeColor !== "No color chosen" ? color : product.images[0]?.url,
        stock: product.stock,
        color: activeColor,
        size: activeSize,
        variant: activeStorage,
        model: model,
      };

      const checkCart = localStorage.getItem("cart");
      const cart = checkCart ? JSON.parse(checkCart) : [];
      const existingItemIndex = cart.findIndex(
        (item) =>
          item.productId === updatedCartItem.productId &&
          item.modelName === updatedCartItem.modelName &&
          item.variant === updatedCartItem.variant &&
          item.color === updatedCartItem.color &&
          item.model === updatedCartItem.model &&
          item.size === updatedCartItem.size
      );

      if (existingItemIndex !== -1) {
        const newQuantity = cart[existingItemIndex].quantity + quantity;
        if (newQuantity > product.stock) {
          toast.error(
            `Cannot add more than available stock (${product.stock})`
          );
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
  const handleMouseMove = (e) => {
    if (!isZoomed) return;

    const { left, top, width, height } =
      e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomPosition({ x, y });
  };

  const buyNow = () => {
    const validationErrors = validateSelections();

    if (validationErrors.length > 0) {
      validationErrors.forEach((field) => {
        toast.error(`Please select a ${field} before proceeding`);
      });
      return;
    }

    const updatedCartItem = {
      productId: product._id,
      name: product.name,
      modelName: product.modelName,
      price:
        variantPrice > 0
          ? variantPrice
          : bundlePrice > 0
          ? bundlePrice / quantity
          : product.sellingPrice,
      quantity: quantity,
      image: activeColor !== "No color chosen" ? color : product.images[0]?.url,
      stock: product.stock,
      color: activeColor,
      variant: activeStorage,
      size: activeSize,
      model: model,
    };

    if (sessionStorage.getItem("buyNow")) {
      sessionStorage.removeItem("buyNow");
    }
    sessionStorage.setItem("buyNow", JSON.stringify(updatedCartItem));
    navigate("/checkout", { state: { buyNow: true } });
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      alert("Please select a rating");
      return;
    }
    if (authUser) {
      try {
        setIsSubmitting(true);

        // Create FormData to handle file uploads
        const formData = new FormData();
        formData.append("productId", product._id);
        formData.append("rating", rating);
        formData.append("comment", comment);
        formData.append("user", authUser?.fullName);
        formData.append("date", new Date().toISOString());

        // Append each media file to the FormData
        mediaFiles.forEach((file) => {
          formData.append("medias", file); // Changed from 'media' to 'medias'
        });

        const response = await axiosInstance.post("/review", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        const reviewResponse = await axiosInstance.post(
          `/review-rating/${product._id}`,
          { rating, comment }
        );

        toast.success("Review posted successfully");
        setIsSubmitting(false);
        setRating(0);
        setComment("");
        setMediaFiles([]);
        setMediaPreview([]);

        // Refresh reviews after posting
        const updatedReviews = await axiosInstance.get(
          `/review/${product._id}`
        );
        const data = updatedReviews.data.response.filter(
          (review) => review.comment.length > 0
        );
        setReviews(data);
        fetchReviews();
        fetchProduct();
      } catch (error) {
        console.error("Error while posting review:", error);
        toast.error(
          error.response?.data?.error ||
            "Failed to post review. Please try again."
        );
      } finally {
        setIsSubmitting(false);
        setIsReviewModalOpen(false);
      }
    } else {
      toast.error("Please login first!");
    }
  };

  const calculateAverageRating = () => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return (sum / reviews.length).toFixed(1);
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "video/mp4",
      "video/quicktime",
    ];
    const maxFileSize = 5 * 1024 * 1024; // 5MB limit

    // Validate files i need to push
    const validFiles = files.filter((file) => {
      if (!allowedTypes.includes(file.type)) {
        setUploadError("Only JPG, PNG, GIF images and MP4 videos are allowed");
        return false;
      }
      if (file.size > maxFileSize) {
        setUploadError("Files must be less than 5MB");
        return false;
      }
      return true;
    });

    if (validFiles.length > 0) {
      setUploadError("");
      setMediaFiles((prevFiles) => [...prevFiles, ...validFiles]);

      // Create preview URLs
      validFiles.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setMediaPreview((prev) => [
            ...prev,
            {
              url: reader.result,
              type: file.type.startsWith("video") ? "video" : "image",
            },
          ]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeMedia = (index) => {
    setMediaFiles((prev) => prev.filter((_, i) => i !== index));
    setMediaPreview((prev) => prev.filter((_, i) => i !== index));
  };

  const KeyFeature = ({ featureHTML }) => {
    return <div dangerouslySetInnerHTML={{ __html: featureHTML }} />;
  };

  const firstWordUppercase = (word) => {
    let wordArray = word.split(" ");
    let modifiedWord = wordArray
      .map((item) => item.charAt(0).toUpperCase() + item.slice(1))
      .join(" ");
    return modifiedWord;
  };

  const handleDeleteReview = async (reviewId) => {
    if (!authUser) {
      toast.error("Please login first!");
      return;
    }

    try {
      setDeletingReviews((prev) => new Set([...prev, reviewId]));
      const response = await axiosInstance.delete(`/review/${reviewId}`);

      if (response.status === 200) {
        // Remove the review from the local state
        setReviews((prevReviews) =>
          prevReviews.filter((review) => review._id !== reviewId)
        );
        toast.success("Review deleted successfully");

        // Update the product's rating
        const updatedReviews = await axiosInstance.get(
          `/review/${product._id}`
        );
        setReviews(updatedReviews.data);
      }
    } catch (error) {
      console.error("Error deleting review:", error);
      toast.error("Failed to delete review");
    } finally {
      setDeletingReviews((prev) => {
        const newSet = new Set(prev);
        newSet.delete(reviewId);
        return newSet;
      });
    }
  };

  const handleWriteReviewClick = () => {
    if (!authUser) {
      toast.error("Please login first!");
      return;
    }
    setIsReviewModalOpen(true);
  };

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-500 mb-4">
              Product not found!
            </h2>
            <button
              onClick={handleBack}
              className="px-4 py-2 bg-black text-white rounded hover:bg-black/80 transition"
            >
              Back
            </button>
          </div>
        </main>
      </div>
    );
  }
  const calculatedPrice =
    variantPrice > 0
      ? variantPrice
      : bundlePrice > 0
      ? bundlePrice
      : product.price;

  return (
    <>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow bg-gray-50">
          <div className="container mx-auto px-4 py-8">
            {/* Breadcrumbs */}
            <div className="flex items-center text-sm text-gray-600 mb-6 flex-wrap">
              <button
                onClick={() => navigate("/")}
                className="hover:text-black"
              >
                Home
              </button>
              <span className="mx-2">/</span>
              <Link
                to="/products"
                state={{ selectedCategory: product.parentCategory }}
                className="text-gray-900 font-medium truncate cursor-pointer"
              >
                {firstWordUppercase(product.parentCategory)}
              </Link>
              <span className="mx-2">/</span>
              <Link
                to="/top-brands"
                state={{ selectedBrand: product.parentSubcategory }}
                className="text-gray-900 font-medium truncate cursor-pointer"
              >
                {firstWordUppercase(product.parentSubcategory)}
              </Link>
              <span className="mx-2">/</span>
              <span className="text-gray-900 font-medium truncate">
                {firstWordUppercase(product.modelName)}
              </span>
            </div>

            {/* Product Details to push */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6">
                {/* Product Image Carousel */}
                <div className="relative group flex flex-col ">
                  {/* Main Image/Video Container */}
                  <div
                    className="relative flex justify-center items-center bg-gray-100 rounded-lg h-80 sm:h-125 overflow-hidden group cursor-grab active:cursor-grabbing"
                    onMouseMove={handleMouseMove}
                    // Better touch behavior & no accidental text selection
                    style={{
                      touchAction: isZoomed ? "none" : "pan-y",
                      userSelect: "none",
                    }}
                  >
                    <AnimatePresence
                      custom={direction}
                      initial={false}
                      mode="popLayout"
                    >
                      <motion.div
                        key={
                          color
                            ? `color-${activeColor || "custom"}`
                            : currentImageIndex === product.images.length
                            ? "video"
                            : `img-${currentImageIndex}`
                        }
                        className="absolute inset-0 flex items-center justify-center"
                        custom={direction}
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 35,
                          opacity: { duration: 0.2 },
                        }}
                        drag={!isZoomed ? "x" : false}
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={0.15}
                        onDragEnd={handleDragEnd}
                        style={{ cursor: isZoomed ? "zoom-out" : "grab" }}
                        whileTap={{ cursor: "grabbing" }}
                      >
                        {/* Render the current media inside the animated wrapper */}
                        {color ? (
                          <img
                            draggable={false}
                            src={color}
                            alt={product.name}
                            className={`w-full h-full object-contain transition-transform duration-300 ${
                              isZoomed ? "scale-150" : "scale-100"
                            }`}
                            style={{
                              transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
                            }}
                            onError={(e) => {
                              e.currentTarget.src = "/placeholder-product.png";
                            }}
                          />
                        ) : currentImageIndex === product.images.length ? (
                          <video
                            src={product.video?.url}
                            autoPlay
                            loop
                            playsInline
                            controls
                            muted={false}
                            className="w-full h-full object-contain rounded-lg"
                          />
                        ) : (
                          <>
                            <img
                              draggable={false}
                              src={
                                product.images?.[currentImageIndex]?.url ||
                                "/placeholder-product.png"
                              }
                              alt={product.name}
                              className={`w-full h-full object-contain transition-transform duration-300 ${
                                isZoomed ? "scale-150" : "scale-100"
                              }`}
                              style={{
                                transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
                              }}
                              onError={(e) => {
                                e.currentTarget.src =
                                  "/placeholder-product.png";
                              }}
                            />
                            {/* {isZoomed && (
                              <div className="absolute bottom-4 right-4 bg-white/80 p-2 rounded-full shadow-md">
                                <FiZoomIn className="w-5 h-5 text-gray-700" />
                              </div>
                            )} */}

                            {/* Zoom toggle button */}
                            <button
                              type="button"
                              onClick={toggleZoom}
                              aria-label={isZoomed ? "Exit zoom" : "Zoom in"}
                              aria-pressed={isZoomed}
                              className="absolute bottom-4 right-4 bg-white/90 hover:bg-white p-2 rounded-full shadow-md transition"
                              onPointerDown={(e) => e.stopPropagation()} // prevent starting a drag
                            >
                              {isZoomed ? (
                                <FiZoomOut className="w-5 h-5 text-gray-700" />
                              ) : (
                                <FiZoomIn className="w-5 h-5 text-gray-700" />
                              )}
                            </button>
                          </>
                        )}
                      </motion.div>
                    </AnimatePresence>

                    {/* Navigation Arrows */}
                    {!color && product.images?.length > 1 && (
                      <>
                        <button
                          onClick={prevImage}
                          className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 text-gray-800 p-2 rounded-full shadow-md hover:bg-white transition opacity-0 group-hover:opacity-100"
                          aria-label="Previous image"
                        >
                          <FaChevronLeft />
                        </button>
                        <button
                          onClick={nextImage}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 text-gray-800 p-2 rounded-full shadow-md hover:bg-white transition opacity-0 group-hover:opacity-100"
                          aria-label="Next image"
                        >
                          <FaChevronRight />
                        </button>
                      </>
                    )}
                  </div>

                  {/* Thumbnail Navigation with Scroll */}
                  {!color && product.images?.length > 0 && (
                    <div className="mt-4 relative">
                      <div className="flex space-x-2 overflow-x-auto py-2 scrollbar-hide pl-2 md:justify-center md:pl-0 snap-x snap-mandatory">
                        {product.images.map((image, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentImageIndex(index)}
                            className={`snap-start flex-shrink-0 w-16 h-16 border-2 rounded-md overflow-hidden transition-all ${
                              currentImageIndex === index
                                ? "border-black"
                                : "border-transparent hover:border-gray-300"
                            }`}
                            aria-label={`View image ${index + 1}`}
                          >
                            <img
                              src={image.url}
                              alt={`${product.name} thumbnail ${index + 1}`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.src = "/placeholder-product.png";
                              }}
                            />
                          </button>
                        ))}

                        {/* Mock Video Thumbnail */}
                        {product.video !== null &&
                          product.video !== undefined &&
                          product.video !== "" && (
                            <button
                              onClick={() =>
                                setCurrentImageIndex(product.images.length)
                              }
                              className={`snap-start flex-shrink-0 w-16 h-16 border-2 rounded-md overflow-hidden transition-all ${
                                currentImageIndex === product.images.length
                                  ? "border-black"
                                  : "border-transparent hover:border-gray-300"
                              }`}
                              aria-label="View video"
                            >
                              <video
                                src={product.video?.url}
                                className="w-full h-full object-cover"
                                muted
                                onMouseOver={(e) => e.target.play()}
                                onMouseOut={(e) => e.target.pause()}
                              />
                            </button>
                          )}
                      </div>
                    </div>
                  )}

                  {/* Image/Video Counter */}
                  {!color && product.images?.length > 0 && (
                    <div className="text-center text-sm text-gray-500 mt-2">
                      {currentImageIndex + 1} /{" "}
                      {product.video !== null &&
                      product.video !== undefined &&
                      product.video !== ""
                        ? product.images.length + 1
                        : product.images.length}
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="space-y-6">
                  <div className="flex justify-between items-start">
                    <h1 className="text-xl lg:text-3xl text-gray-900 text-justify md:text-2xl">
                      {(() => {
                        const name = product.name;
                        const modelList = product.model || [];
                        const hasBracket =
                          name.includes("[") && name.includes("]");

                        if (!hasBracket || modelList.length === 0) return name;

                        const start = name.indexOf("[");
                        const end = name.indexOf("]") + 1;

                        const before = name.slice(0, start);
                        const after = name.slice(end);

                        const replacement = model
                          ? model
                          : `${modelList[0]} - ${
                              modelList[modelList.length - 1]
                            }`;

                        return `${before}${replacement}${after}`;
                      })()}
                    </h1>

                    <button
                      onClick={handleWishlist}
                      className={`p-2 rounded-full focus:outline-none transition-colors ${
                        Wishlistclicked
                          ? "text-pink-500 bg-red-100"
                          : "text-black"
                      } hover:text-pink-500`}
                    >
                      {heartLoading ? (
                        <Loader className="animate-spin" />
                      ) : Wishlistclicked ? (
                        <FaHeart className="w-6 h-6" />
                      ) : (
                        <FaRegHeart className="w-6 h-6" />
                      )}
                    </button>
                  </div>

                  {/* Rating display */}
                  <div>
                    <div className="flex items-center">
                      <div className="flex items-center mr-2">
                        <StarRating
                          rating={Math.round(product.rating * 2) / 2}
                          hover={0}
                          setHover={() => {}}
                          setRating={() => {}}
                          interactive={false}
                        />
                      </div>
                      <span className="text-gray-600">
                        {(Math.round(product.rating * 2) / 2).toFixed(1)} (
                        {product.reviews}{" "}
                        {reviews.length === 1 ? "review" : "reviews"})
                      </span>
                    </div>
                    <div className="text-gray-600">
                      {product.totalRating > 0 && (
                        <em>{product.totalRating} Global Ratings</em>
                      )}
                    </div>
                  </div>

                  {/* Price Section */}
                  <div className="space-y-2">
                    <p className="text-2xl font-bold text-black">
                      Rs. {calculatedPrice}
                    </p>
                    {/* {product.parentCategory === "Screen Protector" && (
                    <p className="text-sm text-gray-500">
                      Unit Price: Rs. {basePrice}
                    </p>
                  )} */}

                    {product.originalPrice && (
                      <div className="flex items-center space-x-2">
                        <span className="text-lg text-gray-500 line-through">
                          {product.originalPrice}
                        </span>
                        <span className="text-lg font-medium text-green-600">
                          {product.discount}
                        </span>
                      </div>
                    )}
                    {product.savings && (
                      <p className="text-green-600">
                        You save: {product.savings}
                      </p>
                    )}
                  </div>

                  {/* Colors Available */}
                  {product.color?.length > 0 && (
                    <div>
                      <h3 className="text-xs font-medium text-gray-700 uppercase tracking-wider mb-2">
                        Colors Available:
                      </h3>
                      <div className="flex flex-wrap gap-1.5">
                        {product.color.map((item, index) => (
                          <div
                            key={index}
                            className={`px-3 py-1.5 text-sm border rounded-md cursor-pointer transition-colors
                            ${
                              activeColor === item.colorName
                                ? "bg-black text-white border-black"
                                : "bg-white text-gray-900 border-gray-300 hover:border-gray-400"
                            }`}
                            onClick={() =>
                              handleColor(item.image, item.colorName)
                            }
                          >
                            {item.colorName}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Quantity Pack Selector for Screen Protectors */}
                  {product?.parentCategory === "Screen Protector" && (
                    <div className="py-4">
                      <h3 className="text-xs font-medium text-gray-700 uppercase tracking-wider mb-2">
                        Choose Quantity Pack
                      </h3>
                      <div className="flex gap-2 flex-wrap">
                        {[
                          { bundle: "1x", bundlePrice: product.price },
                          ...product.bundle,
                        ].map((pack) => (
                          <button
                            key={pack.bundle}
                            onClick={() => {
                              setSelectedPack((prev) =>
                                prev === pack.bundle ? null : pack.bundle
                              );
                              handleBundle(pack.bundlePrice);
                              setQuantity(Number(pack.bundle[0]));
                            }}
                            className={`px-3 py-1.5 text-sm border rounded-md cursor-pointer transition-colors ${
                              selectedPack === pack.bundle
                                ? "bg-black text-white border-black"
                                : "bg-white text-gray-900 border-gray-300 hover:border-gray-400"
                            }`}
                          >
                            {pack.bundle}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {product.model?.length > 0 && (
                    <div className="py-4">
                      <h3 className="text-xs font-medium text-gray-700 uppercase tracking-wider mb-2">
                        Select your phone model
                      </h3>
                      <div className="overflow-x-auto phoneModelScroll">
                        <div className="flex gap-1.5 w-max">
                          {product.model.map((item, index) => (
                            <div
                              key={index}
                              className={`px-3 py-1.5 text-sm border rounded-md cursor-pointer transition-colors
              ${
                model === item
                  ? "bg-black text-white border-black"
                  : "bg-white text-gray-900 border-gray-300 hover:border-gray-400"
              }`}
                              onClick={() => handleModel(item)}
                            >
                              {item}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  {/* Compact Size Selector */}
                  {product.size?.length > 0 && (
                    <div className="py-4">
                      <div className="mb-4">
                        <h3 className="text-xs font-medium text-gray-700 uppercase tracking-wider mb-2">
                          Size
                        </h3>
                        <div className="flex flex-wrap gap-1.5">
                          {product.size.map((s) => (
                            <button
                              key={s.sizeName}
                              onClick={() => {
                                handleSize(s.sizeName.toLowerCase());
                              }}
                              className={`px-3 py-1.5 text-sm border rounded-md cursor-pointer transition-colors
              ${
                activeSize === s.sizeName.toLowerCase()
                  ? "bg-black text-white border-black"
                  : "bg-white text-gray-900 border-gray-300 hover:border-gray-400"
              }
            `}
                            >
                              {s.sizeName}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Compact Variant Selector - Storage and RAM */}
                  {product.variant.length > 0 && (
                    <div className="py-4">
                      {/* Storage Options */}
                      <div className="mb-4">
                        <h3 className="text-xs font-medium text-gray-700 uppercase tracking-wider mb-2">
                          Variant
                        </h3>
                        <div className="flex flex-wrap gap-1.5">
                          {product.variant.map((size) => (
                            <button
                              key={size.variantName}
                              onClick={() => {
                                handleVariant(
                                  size.variantName.toLowerCase(),
                                  size.variantSP
                                );
                              }}
                              className={`px-3 py-1.5 text-sm border rounded-md cursor-pointer transition-colors
            ${
              activeStorage === size.variantName.toLowerCase()
                ? "bg-black text-white border-black"
                : "bg-white text-gray-900 border-gray-300 hover:border-gray-400"
            }
          `}
                            >
                              {size.variantName}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  <hr className="border-gray-300" />

                  <div className="grid grid-cols-3 gap-2 max-w-6xl mx-auto py-4">
                    {/* Card 1 */}
                    <div className="group rounded-xl border border-gray-200 shadow-sm p-3 text-center bg-white transition-all duration-200 transform hover:scale-105 hover:border-pink-500">
                      <Truck className="w-6 h-6 mx-auto text-yellow-500 mb-2 group-hover:text-pink-600 transition-colors duration-200" />
                      <h3 className="text-sm font-bold text-gray-900 mb-1 group-hover:text-pink-600 transition-colors duration-200">
                        Free Delivery
                      </h3>
                      <p className="text-xs text-gray-600 leading-snug">
                        We deliver all across Australia with zero shipping cost.
                      </p>
                    </div>

                    {/* Card 2 */}
                    <div className="group rounded-xl border border-gray-200 shadow-sm p-3 text-center bg-white transition-all duration-200 transform hover:scale-105 hover:border-pink-500">
                      <Shield className="w-6 h-6 mx-auto text-blue-500 mb-2 group-hover:text-pink-600 transition-colors duration-200" />
                      <h3 className="text-sm font-bold text-gray-900 mb-1 group-hover:text-pink-600 transition-colors duration-200">
                        14 Days Free Return
                      </h3>
                      <p className="text-xs text-gray-600 leading-snug">
                        Hassle-free returns within 14 days of purchase.
                      </p>
                    </div>

                    {/* Card 3 */}
                    <div className="group rounded-xl border border-gray-200 shadow-sm p-3 text-center bg-white transition-all duration-200 transform hover:scale-105 hover:border-pink-500">
                      <BadgeCheck className="w-6 h-6 mx-auto text-pink-500 mb-2 group-hover:text-pink-600 transition-colors duration-200" />
                      <h3 className="text-sm font-bold text-gray-900 mb-1 group-hover:text-pink-600 transition-colors duration-200">
                        Authorized Dealer
                      </h3>
                      <p className="text-xs text-gray-600 leading-snug">
                        100% genuine products, warranty-backed.
                      </p>
                    </div>
                  </div>

                  <hr className="border-gray-300" />

                  {/* Stock Availability */}
                  <div className="text-sm text-gray-600 flex items-center">
                    {product.stock > 0 ? (
                      <>
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                        <span className="mr-2">
                          {product.stock} available in stock
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="w-2 h-2 bg-red-500 rounded-full mr-1"></span>
                        <span className="mr-2">Out of stock</span>
                      </>
                    )}
                    {product.sold > 0 && (
                      <>
                        <span className="w-2 h-2 bg-red-300 rounded-full mr-1"></span>
                        {product.sold} sold
                      </>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
                    {cartLoading ? (
                      <button
                        className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 cursor-pointer transition flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled
                      >
                        <div className="flex items-center justify-center">
                          <span className="mr-2">Loading...</span>
                          <Loader className="animate-spin" />
                        </div>
                      </button>
                    ) : (
                      <button
                        className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 cursor-pointer transition flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={addToCart}
                        disabled={product.stock <= 0}
                      >
                        Add to Cart
                      </button>
                    )}
                    <button
                      className="px-6 py-3 border border-black text-black rounded-lg hover:bg-gray-100 cursor-pointer transition flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={buyNow}
                      disabled={product.stock <= 0}
                    >
                      Buy Now
                    </button>
                  </div>

                  {/* Additional Details */}
                  <div className="pt-6 border-t border-gray-200">
                    <h3 className="text-lg font-medium mb-3">
                      Product Details
                    </h3>
                    <ul className="space-y-2">
                      <li className="flex gap-20">
                        <span className="text-gray-600 w-8">Brand</span>
                        <span>{product.parentSubcategory}</span>
                      </li>
                      <li className="flex gap-20">
                        <span className="text-gray-600 w-8 ">Model</span>
                        <span>{firstWordUppercase(product.modelName)}</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <hr className="border-gray-300" />
              {product.parentCategory && (
                <div className="flex flex-col gap-2 px-6 py-4 bg-white">
                  <h2 className="text-lg font-semibold text-gray-700">
                    Description
                  </h2>
                  <p className="text-gray-600 leading-relaxed text-justify">
                    {product.description}
                  </p>
                </div>
              )}

              {/* Phone specifications */}
              {product.parentCategory === "Phone" && product.specs && (
                <div className="border-t border-gray-200 p-6">
                  <h2 className="text-2xl font-bold mb-6">
                    Phone Specifications
                  </h2>
                  <table className="min-w-full border border-gray-300 shadow-md rounded-md overflow-hidden text-sm">
                    <thead className="bg-gray-200 text-gray-700">
                      <tr>
                        <th className="px-4 py-2 text-left border-b border-gray-300">
                          Specification
                        </th>
                        <th className="px-4 py-2 text-left border-b border-gray-300">
                          Details
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {Object.entries(product.specs).map(([key, value]) => (
                        <tr
                          key={key}
                          className={
                            Object.keys(product.specs).indexOf(key) % 2 === 0
                              ? "bg-gray-50"
                              : ""
                          }
                        >
                          <td className="px-4 py-2 font-medium capitalize">
                            {key.replace(/([A-Z])/g, " $1").trim()}
                          </td>
                          <td className="px-4 py-2">{value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Charger specifications */}
              {product.parentCategory === "Charger" && product.chargerSpecs && (
                <div className="border-t border-gray-200 p-6">
                  <h2 className="text-2xl font-bold mb-6">
                    Charger Specifications
                  </h2>
                  <table className="min-w-full border border-gray-300 shadow-md rounded-md overflow-hidden text-sm">
                    <thead className="bg-gray-200 text-gray-700">
                      <tr>
                        <th className="px-4 py-2 text-left border-b border-gray-300">
                          Specification
                        </th>
                        <th className="px-4 py-2 text-left border-b border-gray-300">
                          Details
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {Object.entries(product.chargerSpecs).map(
                        ([key, value]) => (
                          <tr
                            key={key}
                            className={
                              Object.keys(product.chargerSpecs).indexOf(key) %
                                2 ===
                              0
                                ? "bg-gray-50"
                                : ""
                            }
                          >
                            <td className="px-4 py-2 font-medium capitalize">
                              {key.replace(/([A-Z])/g, " $1").trim()}
                            </td>
                            <td className="px-4 py-2">{value}</td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Laptop specifications */}
              {product.parentCategory === "Laptop" && product.laptopSpecs && (
                <div className="border-t border-gray-200 p-6">
                  <h2 className="text-2xl font-bold mb-6">
                    Laptop Specifications
                  </h2>
                  <table className="min-w-full border border-gray-300 shadow-md rounded-md overflow-hidden text-sm">
                    <thead className="bg-gray-200 text-gray-700">
                      <tr>
                        <th className="px-4 py-2 text-left border-b border-gray-300">
                          Specification
                        </th>
                        <th className="px-4 py-2 text-left border-b border-gray-300">
                          Details
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {Object.entries(product.laptopSpecs).map(
                        ([key, value]) => (
                          <tr
                            key={key}
                            className={
                              Object.keys(product.laptopSpecs).indexOf(key) %
                                2 ===
                              0
                                ? "bg-gray-50"
                                : ""
                            }
                          >
                            <td className="px-4 py-2 font-medium capitalize">
                              {key.replace(/([A-Z])/g, " $1").trim()}
                            </td>
                            <td className="px-4 py-2">{value}</td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              )}
              {/* Powerbank specifications */}
              {product.parentCategory === "Powerbank" &&
                product.powerbankSpecs && (
                  <div className="border-t border-gray-200 p-6">
                    <h2 className="text-2xl font-bold mb-6">
                      Powerbank Specifications
                    </h2>
                    <table className="min-w-full border border-gray-300 shadow-md rounded-md overflow-hidden text-sm">
                      <thead className="bg-gray-200 text-gray-700">
                        <tr>
                          <th className="px-4 py-2 text-left border-b border-gray-300">
                            Specification
                          </th>
                          <th className="px-4 py-2 text-left border-b border-gray-300">
                            Details
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {Object.entries(product.powerbankSpecs).map(
                          ([key, value]) => (
                            <tr
                              key={key}
                              className={
                                Object.keys(product.powerbankSpecs).indexOf(
                                  key
                                ) %
                                  2 ===
                                0
                                  ? "bg-gray-50"
                                  : ""
                              }
                            >
                              <td className="px-4 py-2 font-medium capitalize">
                                {key.replace(/([A-Z])/g, " $1").trim()}
                              </td>
                              <td className="px-4 py-2">{value}</td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              {/* Earbud specifications */}
              {product.parentCategory === "Earbud" && product.earbudSpecs && (
                <div className="border-t border-gray-200 p-6">
                  <h2 className="text-2xl font-bold mb-6">
                    Earbud Specifications
                  </h2>
                  <table className="min-w-full border border-gray-300 shadow-md rounded-md overflow-hidden text-sm">
                    <thead className="bg-gray-200 text-gray-700">
                      <tr>
                        <th className="px-4 py-2 text-left border-b border-gray-300">
                          Specification
                        </th>
                        <th className="px-4 py-2 text-left border-b border-gray-300">
                          Details
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {Object.entries(product.earbudSpecs).map(
                        ([key, value]) => (
                          <tr
                            key={key}
                            className={
                              Object.keys(product.earbudSpecs).indexOf(key) %
                                2 ===
                              0
                                ? "bg-gray-50"
                                : ""
                            }
                          >
                            <td className="px-4 py-2 font-medium capitalize">
                              {key.replace(/([A-Z])/g, " $1").trim()}
                            </td>
                            <td className="px-4 py-2">{value}</td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              )}
              {/* Smartwatch specifications */}
              {product.parentCategory === "Smartwatch" &&
                product.watchSpecs && (
                  <div className="border-t border-gray-200 p-6">
                    <h2 className="text-2xl font-bold mb-6">
                      Smartwatch Specifications
                    </h2>
                    <table className="min-w-full border border-gray-300 shadow-md rounded-md overflow-hidden text-sm">
                      <thead className="bg-gray-200 text-gray-700">
                        <tr>
                          <th className="px-4 py-2 text-left border-b border-gray-300">
                            Specification
                          </th>
                          <th className="px-4 py-2 text-left border-b border-gray-300">
                            Details
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {Object.entries(product.watchSpecs).map(
                          ([key, value]) => (
                            <tr
                              key={key}
                              className={
                                Object.keys(product.watchSpecs).indexOf(key) %
                                  2 ===
                                0
                                  ? "bg-gray-50"
                                  : ""
                              }
                            >
                              <td className="px-4 py-2 font-medium capitalize">
                                {key.replace(/([A-Z])/g, " $1").trim()}
                              </td>
                              <td className="px-4 py-2">{value}</td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              {/* Speaker specifications */}
              {product.parentCategory === "Speaker" && product.speakerSpecs && (
                <div className="border-t border-gray-200 p-6">
                  <h2 className="text-2xl font-bold mb-6">
                    Speaker Specifications
                  </h2>
                  <table className="min-w-full border border-gray-300 shadow-md rounded-md overflow-hidden text-sm">
                    <thead className="bg-gray-200 text-gray-700">
                      <tr>
                        <th className="px-4 py-2 text-left border-b border-gray-300">
                          Specification
                        </th>
                        <th className="px-4 py-2 text-left border-b border-gray-300">
                          Details
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {Object.entries(product.speakerSpecs).map(
                        ([key, value]) => (
                          <tr
                            key={key}
                            className={
                              Object.keys(product.speakerSpecs).indexOf(key) %
                                2 ===
                              0
                                ? "bg-gray-50"
                                : ""
                            }
                          >
                            <td className="px-4 py-2 font-medium capitalize">
                              {key.replace(/([A-Z])/g, " $1").trim()}
                            </td>
                            <td className="px-4 py-2">{value}</td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              <hr className="border-gray-300" />

              <div className="flex flex-col gap-2 px-6 py-4 bg-white">
                <h2 className="text-lg font-semibold text-gray-700">
                  Key Features
                </h2>
                <div className="text-gray-600 leading-relaxed whitespace-pre-line text-justify">
                  <KeyFeature featureHTML={product.keyFeatures} />
                </div>
              </div>

              <div className="bg-gradient-to-b from-orange-50 to-white py-16 px-4 sm:px-6 text-center">
                {/* Heading */}
                <motion.div
                  className="relative z-10 mb-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <h2 className="text-3xl sm:text-4xl font-bold text-orange-500 mb-4">
                    Why Us?
                  </h2>
                  <p className="text-gray-700 text-sm sm:text-base md:text-lg max-w-2xl mx-auto">
                    We’re not just another store to bridge we offer trustworthy
                    service, rapid delivery, and real value. Here’s what drives
                    us:
                  </p>
                </motion.div>

                {/* Features */}
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 max-w-5xl mx-auto mb-10">
                  {/* Feature 1 */}
                  <motion.div
                    className="flex flex-col items-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white rounded-full shadow-md flex items-center justify-center mb-3 hover:scale-105 transform transition-transform duration-200 ease-in-out">
                      <Truck className="w-9 h-9 sm:w-10 sm:h-10 text-gray-800" />
                    </div>
                    <p className="text-xs sm:text-sm md:text-base font-semibold text-gray-800 text-center max-w-[140px]">
                      Fast Nationwide Delivery
                    </p>
                  </motion.div>

                  {/* Feature 2 */}
                  <motion.div
                    className="flex flex-col items-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white rounded-full shadow-md flex items-center justify-center mb-3 hover:scale-105 transform transition-transform duration-200 ease-in-out">
                      <BadgeCheck className="w-9 h-9 sm:w-10 sm:h-10 text-gray-800" />
                    </div>
                    <p className="text-xs sm:text-sm md:text-base font-semibold text-gray-800 text-center max-w-[140px]">
                      100% Genuine Products
                    </p>
                  </motion.div>

                  {/* Feature 3 i need to push*/}
                  <motion.div
                    className="flex flex-col items-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white rounded-full shadow-md flex items-center justify-center mb-3 hover:scale-105 transform transition-transform duration-200 ease-in-out">
                      <Headset className="w-9 h-9 sm:w-10 sm:h-10 text-gray-800" />
                    </div>
                    <p className="text-xs sm:text-sm md:text-base font-semibold text-gray-800 text-center max-w-[140px]">
                      People-First Support
                    </p>
                  </motion.div>

                  {/* Feature 4 */}
                  <motion.div
                    className="flex flex-col items-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white rounded-full shadow-md flex items-center justify-center mb-3 hover:scale-105 transform transition-transform duration-200 ease-in-out">
                      <Tag className="w-9 h-9 sm:w-10 sm:h-10 text-gray-800" />
                    </div>
                    <p className="text-xs sm:text-sm md:text-base font-semibold text-gray-800 text-center max-w-[140px]">
                      Transparent Pricing
                    </p>
                  </motion.div>
                </div>
              </div>

              <hr className="border-gray-300" />

              {/* Reviews Section */}
              <div className="border-t border-gray-200 p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">Customer Reviews</h2>
                  <button
                    onClick={handleWriteReviewClick}
                    className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition"
                  >
                    Write a Review
                  </button>
                </div>

                {/* Reviews List */}
                <div className="space-y-6">
                  {reviews.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">
                        No reviews yet. Be the first to review!
                      </p>
                    </div>
                  ) : (
                    reviews.map((review) => (
                      <div
                        key={review._id || review.id}
                        className="border-b border-gray-200 pb-6 last:border-b-0 group"
                      >
                        <div className="flex items-start">
                          <FiUser className="w-9 h-9 bg-gray-50 text-black rounded-full mr-5" />
                          <div className="flex-1">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                              <div className="flex items-center mb-2 sm:mb-0">
                                <div className="flex mr-2">
                                  <StarRating
                                    rating={review.rating}
                                    hover={0}
                                    setHover={() => {}}
                                    setRating={() => {}}
                                    interactive={false}
                                  />
                                </div>
                                <span className="font-medium">
                                  {review.user}
                                </span>
                              </div>
                              <div className="flex items-center gap-4">
                                <span className="text-gray-500 text-sm">
                                  {new Date(review.date).toLocaleDateString(
                                    "en-US",
                                    {
                                      year: "numeric",
                                      month: "short",
                                      day: "numeric",
                                    }
                                  )}
                                </span>
                                {authUser &&
                                  authUser.fullName === review.user && (
                                    <button
                                      onClick={() =>
                                        handleDeleteReview(review._id)
                                      }
                                      disabled={deletingReviews.has(review._id)}
                                      className="text-red-500 hover:text-red-700 transition-colors p-1 rounded-full hover:bg-red-50"
                                      title="Delete review"
                                    >
                                      {deletingReviews.has(review._id) ? (
                                        <svg
                                          className="animate-spin h-5 w-5"
                                          xmlns="http://www.w3.org/2000/svg"
                                          fill="none"
                                          viewBox="0 0 24 24"
                                        >
                                          <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                          ></circle>
                                          <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                          ></path>
                                        </svg>
                                      ) : (
                                        <svg
                                          className="w-5 h-5"
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                          />
                                        </svg>
                                      )}
                                    </button>
                                  )}
                              </div>
                            </div>
                            <p className="text-gray-800 mt-2 whitespace-pre-line group-hover:text-gray-900 transition-colors">
                              {review.comment}
                            </p>

                            {/* Review Media Display */}
                            {review.medias && review.medias.length > 0 && (
                              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                {review.medias.map((media, index) => (
                                  <div key={index} className="relative group">
                                    {media.type === "video" ? (
                                      <div className="relative">
                                        <video
                                          src={media.url}
                                          className="w-full aspect-square object-contain rounded-lg cursor-pointer bg-gray-100"
                                          controls
                                          preload="metadata"
                                        />
                                      </div>
                                    ) : (
                                      <div className="relative overflow-hidden group">
                                        <img
                                          src={media.url}
                                          alt={`Review media ${index + 1}`}
                                          className="w-full aspect-square object-contain rounded-lg transition-transform duration-300 group-hover:scale-105 bg-gray-100"
                                          onClick={() =>
                                            window.open(media.url, "_blank")
                                          }
                                        />
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <SimilarProducts products={similarProducts} authUser={authUser} />
            </div>
          </div>
        </main>

        {/* Review Modal */}
        {isReviewModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">Write a Review</h3>
                  <button
                    onClick={() => setIsReviewModalOpen(false)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                <form onSubmit={handleSubmitReview}>
                  <div className="mb-4">
                    <label className="block text-gray-700 mb-2">Rating</label>
                    <StarRating
                      rating={rating}
                      setRating={setRating}
                      hover={hover}
                      setHover={setHover}
                    />
                  </div>

                  <div className="mb-4">
                    <label
                      htmlFor="comment"
                      className="block text-gray-700 mb-2"
                    >
                      Comment
                    </label>
                    <textarea
                      id="comment"
                      rows="4"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black resize-none"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                    />
                  </div>

                  {/* Media Upload Section */}
                  <div className="mb-4">
                    <label className="block text-gray-700 mb-2">
                      Add Photos/Videos
                      <span className="text-sm text-gray-500 ml-2">
                        (Max 5MB per file)
                      </span>
                    </label>
                    <div className="flex items-center justify-center w-full">
                      <label className="w-full flex flex-col items-center px-4 py-6 bg-white rounded-lg border-2 border-dashed border-gray-300 cursor-pointer hover:bg-gray-50">
                        <svg
                          className="w-8 h-8 text-gray-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                          />
                        </svg>
                        <span className="mt-2 text-sm text-gray-600">
                          Click to upload images/videos
                        </span>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/jpeg,image/png,image/gif,video/mp4,video/quicktime"
                          multiple
                          onChange={handleFileChange}
                        />
                      </label>
                    </div>
                    {uploadError && (
                      <p className="mt-2 text-sm text-red-600">{uploadError}</p>
                    )}

                    {/* Media Preview */}
                    {mediaPreview.length > 0 && (
                      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {mediaPreview.map((media, index) => (
                          <div key={index} className="relative group">
                            {media.type === "image" ? (
                              <img
                                src={media.url}
                                alt={`Preview ${index + 1}`}
                                className="w-full h-24 object-cover rounded-lg"
                              />
                            ) : (
                              <video
                                src={media.url}
                                className="w-full h-24 object-cover rounded-lg"
                                controls
                              />
                            )}
                            <button
                              type="button"
                              onClick={() => removeMedia(index)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-4">
                    <button
                      type="button"
                      onClick={() => setIsReviewModalOpen(false)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={`px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition flex items-center justify-center ${
                        isSubmitting ? "opacity-70 cursor-not-allowed" : ""
                      }`}
                    >
                      {isSubmitting ? (
                        <>
                          <svg
                            className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Submitting...
                        </>
                      ) : (
                        "Submit Review"
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

const SimilarProducts = ({
  products = [],
  title = "Similar Products",
  authUser,
}) => {
  const displayProducts = products;

  const carouselRef = useRef(null);

  const handleAddToCart = async (product) => {
    if (authUser) {
      try {
        const response = await axiosInstance.post("/cart/add", {
          userId: authUser._id,
          productId: product.id,
          modelName: product.modelName,
          name: product.name,
          price: product.sellingPrice,
          quantity: 1,
          image: product.images[0]?.url,
          stock: product.stock,
          color: "No color chosen",
          variant: "No variant chosen",
          model: "No model chosen",
        });
        toast.success(response.data.message);
      } catch (error) {
        console.error("Error adding to cart:", error);
        toast.error("Failed to add to cart");
      }
    } else {
      const updatedCartItem = {
        productId: product._id,
        name: product.name,
        modelName: product.modelName,
        price: product.sellingPrice,
        quantity: 1,
        image: product.images[0]?.url,
        stock: product.stock,
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
        if (newQuantity > product.stock) {
          toast.error(
            `Cannot add more than available stock (${product.stock})`
          );
          return;
        }
        cart[existingItemIndex].quantity = newQuantity;
        toast.success("Product quantity updated in cart");
      } else {
        cart.push(updatedCartItem);
        toast.success("Product added to cart");
      }

      localStorage.setItem("cart", JSON.stringify(cart));
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Star key={i} className="w-4 h-4 fill-yellow-400 stroke-yellow-400" />
      );
    }

    if (hasHalfStar) {
      stars.push(
        <Star
          key="half"
          className="w-4 h-4 fill-yellow-400/50 stroke-yellow-400"
        />
      );
    }

    const remainingStars = 5 - Math.ceil(rating);
    for (let i = 0; i < remainingStars; i++) {
      stars.push(
        <Star key={`empty-${i}`} className="w-4 h-4 stroke-gray-300" />
      );
    }

    return stars;
  };

  const scrollCarousel = (direction) => {
    if (!carouselRef.current) return;
    const scrollAmount = 200;
    carouselRef.current.scrollBy({
      left: direction * scrollAmount,
      behavior: "smooth",
    });
  };

  return (
    <section className="py-12 bg-gray-50">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">{title}</h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-sm">
            Discover more products you might love based on your interests
          </p>
        </div>

        {/* Products Grid */}
        <div className="relative">
          {/* Left Arrow */}
          <div className="absolute -left-0 md:-left-6 top-1/2 transform -translate-y-1/2 z-10 hidden md:block">
            <button
              onClick={() => scrollCarousel(-1)}
              className="bg-white p-3 rounded-full text-gray-800 hover:text-gray-600 transition shadow-md hover:shadow-lg"
              aria-label="Scroll left"
            >
              <FaChevronLeft className="h-5 w-5" />
            </button>
          </div>

          {/* Right Arrow */}
          <div className="absolute -right-0 md:-right-6 top-1/2 transform -translate-y-1/2 z-10 hidden md:block">
            <button
              onClick={() => scrollCarousel(1)}
              className="bg-white p-3 rounded-full text-gray-800 hover:text-gray-600 transition shadow-md hover:shadow-lg"
              aria-label="Scroll right"
            >
              <FaChevronRight className="h-5 w-5" />
            </button>
          </div>

          <div
            ref={carouselRef}
            style={{
              scrollSnapType: "x mandatory",
              scrollBehavior: "smooth",
              WebkitOverflowScrolling: "touch",
            }}
            className="flex gap-4 max-w-[1400px] mx-auto overflow-x-scroll touch-pan-x scroll-smooth w-full px-1"
          >
            {displayProducts.map((product) => (
              <div
                key={product.id}
                style={{ scrollSnapAlign: "start" }}
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group cursor-pointer w-[220px] flex-shrink-0 border border-gray-100"
              >
                <Link
                  to={`/products/${product.modelName.replace(/\s+/g, "-")}`}
                >
                  {/* Product Image */}
                  <div className="relative w-full aspect-square bg-gray-100 overflow-hidden">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-contain p-4 transition-transform duration-300 group-hover:scale-105"
                    />

                    {/* Discount Badge */}
                    {product.discount && (
                      <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-0.5 rounded text-[10px] font-semibold">
                        {product.discount}
                      </div>
                    )}

                    {/* Stock Status */}
                    {!product.inStock && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <span className="text-white text-xs font-medium bg-black/70 px-2 py-1 rounded">
                          Out of Stock
                        </span>
                      </div>
                    )}
                  </div>
                </Link>

                {/* Product Info */}
                <div className="p-3">
                  {/* Category */}
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">
                    {product.parentCategory} • {product.parentSubcategory}
                  </p>

                  {/* Name */}
                  <h3 className="text-gray-900 text-sm font-medium leading-tight line-clamp-2 mb-8 ">
                    {product.name}
                  </h3>

                  {/* Description (optional short description) */}
                  {product.shortDescription && (
                    <p className="text-xs text-gray-500 mb-3 line-clamp-2 min-h-[2rem]">
                      {product.shortDescription}
                    </p>
                  )}

                  {/* Price & Stock */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-900">
                      Rs.{product.currentPrice}
                    </span>
                    {product.inStock && (
                      <span className="text-xs text-gray-600">
                        🟢 {product.stock} in stock
                      </span>
                    )}
                  </div>

                  {/* Rating */}
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                    <div className="flex items-center space-x-1">
                      {renderStars(product.rating)}
                    </div>
                    <span>({product.reviews})</span>
                  </div>

                  {/* Free Shipping */}
                  {product.freeShipping && (
                    <div className="flex items-center gap-1 mb-2 text-green-600 text-xs">
                      <Truck className="w-4 h-4" />
                      <span className="font-medium">Free Shipping</span>
                    </div>
                  )}

                  {/* Add to Cart Button */}
                  <button
                    onClick={() => handleAddToCart(product)}
                    className={`w-full py-1.5 px-4 rounded-md font-medium transition-all duration-300 flex items-center justify-center gap-2 text-sm ${
                      product.inStock
                        ? "bg-black text-white hover:bg-gray-800"
                        : "bg-gray-200 text-gray-500 cursor-not-allowed"
                    }`}
                    disabled={!product.inStock}
                  >
                    <ShoppingCart className="w-4 h-4" />
                    {product.inStock ? "Add to Cart" : "Out of Stock"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
    .touch-pan-x {
      touch-action: auto;
      -webkit-overflow-scrolling: touch;
      scrollbar-width: none;
      -ms-overflow-style: none;
    }

    .touch-pan-x::-webkit-scrollbar {
      display: none;
    }
  `}</style>
    </section>
  );
};

export default ProductDetails;
