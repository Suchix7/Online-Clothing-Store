import { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { axiosInstance } from "../lib/axiosInstance.js";
import Navbar from "../components/Navbar.jsx";
import { AnimatePresence, motion } from "framer-motion";
import SvgLoader from "../components/SvgLoader";

// Global state for caching
const pageState = {
  cache: {},
  lastScrollPosition: 0,
  lastBrand: null,
  isBackNavigation: false,
};

function TopBrandsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const brand = location.state?.selectedBrand;
  const hasRestoredScroll = useRef(false);
  const getColorClass = (colorName) => {
    const colorMap = {
      black: "bg-black",
      white: "bg-white border border-gray-200",
      red: "bg-red-500",
      blue: "bg-blue-500",
      green: "bg-green-500",
      yellow: "bg-yellow-400",
      purple: "bg-purple-500",
      pink: "bg-pink-500",
      gray: "bg-gray-500",
      brown: "bg-amber-800",
      orange: "bg-orange-500",
      silver: "bg-gray-300",
      gold: "bg-yellow-600",
      navy: "bg-blue-900",
      beige: "bg-yellow-100",
      maroon: "bg-red-900",
      cyan: "bg-cyan-500",
      teal: "bg-teal-500",
      indigo: "bg-indigo-500",
      violet: "bg-violet-500",
    };

    // Convert color name to lowercase for matching
    const normalizedColor = colorName.toLowerCase();
    return colorMap[normalizedColor] || "bg-gray-200"; // default color if no match
  };
  // Effect to restore scroll position
  useEffect(() => {
    if (
      pageState.isBackNavigation &&
      !hasRestoredScroll.current &&
      products.length > 0
    ) {
      requestAnimationFrame(() => {
        window.scrollTo(0, pageState.lastScrollPosition || 0);
        hasRestoredScroll.current = true;
      });
      pageState.isBackNavigation = false;
    }
  }, [products]);

  useEffect(() => {
    if (!brand) {
      navigate("/", { replace: true });
      return;
    }

    // If we have cached data for this brand and we're returning from product page
    if (pageState.cache[brand] && pageState.lastBrand === brand) {
      setProducts(pageState.cache[brand]);
      setLoading(false);
      return;
    }

    // If it's a new brand or first load
    setLoading(true);
    axiosInstance
      .get(`/product/subcategory/${encodeURIComponent(brand)}`)
      .then((res) => {
        const formattedProducts = res.data.map((product) => ({
          id: product._id,
          modelName: product.modelName.replace(/\s+/g, "-"),
          name: product.name,
          price: product.sellingPrice,
          color: product.color || [],
          rating: product.rating || 0, // ✅ real rating from DB
          reviews: product.reviews || 0,
          inStock: product.stock > 0,
          stock: product.stock || 0,
          description: product.description,
          freeShipping: product.freeShipping || true,
          image: product.images?.[0]?.url || "/placeholder.svg",
        }));

        // Cache the products
        pageState.cache[brand] = formattedProducts;
        pageState.lastBrand = brand;
        setProducts(formattedProducts);
        setLoading(false);

        // Only scroll to top if it's not a back navigation
        if (!pageState.isBackNavigation) {
          window.scrollTo(0, 0);
        }
      })
      .catch((err) => {
        console.error("Error fetching products:", err);
        setError("Failed to load products.");
        setLoading(false);
      });
  }, [brand, navigate]);

  // Clear cache when unmounting if not navigating to product details
  useEffect(() => {
    return () => {
      if (!pageState.isBackNavigation) {
        pageState.cache = {};
        pageState.lastScrollPosition = 0;
        pageState.lastBrand = null;
      }
    };
  }, []);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100"
      >
        <Navbar />
        <div className="py-4 sm:py-12 px-2 sm:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6 sm:mb-12">
              <div>
                <h1 className="text-xl sm:text-4xl font-bold text-gray-900 mb-1 sm:mb-2">
                  {brand} Products
                </h1>
                <p className="text-xs sm:text-base text-gray-600">
                  Discover our curated collection of {brand} products
                </p>
              </div>
              <button
                className="px-3 sm:px-6 py-2 sm:py-3 bg-black text-white text-xs sm:text-sm rounded-full shadow-lg hover:bg-gray-800 transition-all duration-300 transform hover:scale-105 flex items-center gap-1 sm:gap-2"
                onClick={() => {
                  pageState.isBackNavigation = false;
                  navigate(-1);
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 sm:h-5 sm:w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                    clipRule="evenodd"
                  />
                </svg>
                Back
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center items-center h-64">
                <SvgLoader />
              </div>
            ) : error ? (
              <div className="text-center py-20">
                <div className="bg-red-50 p-8 rounded-2xl shadow-sm">
                  <svg
                    className="mx-auto h-12 w-12 text-red-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  <h3 className="mt-4 text-lg font-medium text-red-800">
                    {error}
                  </h3>
                </div>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl shadow-sm">
                <svg
                  className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <h3 className="mt-4 text-lg sm:text-xl font-medium text-gray-900">
                  No products found for {brand}
                </h3>
                <p className="mt-2 text-xs sm:text-base text-gray-500">
                  Try checking back later or browse other brands
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-x-2 gap-y-3 sm:gap-x-4 sm:gap-y-6 lg:grid-cols-3 xl:grid-cols-4 lg:gap-6">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="group relative bg-white rounded-lg sm:rounded-2xl shadow-sm overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex flex-col h-full"
                  >
                    <Link
                      to={`/products/${product.modelName}`}
                      state={{ fromTopBrandsPage: true }}
                      onClick={() => {
                        pageState.lastScrollPosition = window.scrollY;
                        pageState.lastBrand = brand;
                        pageState.isBackNavigation = true;
                      }}
                      className="flex flex-col h-full"
                    >
                      <div className="relative w-full pt-[100%] bg-gray-100">
                        <div className="absolute inset-0 p-2 sm:p-6 flex items-center justify-center">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-contain transform group-hover:scale-110 transition-transform duration-300"
                          />
                        </div>
                      </div>
                      <div className="flex flex-col flex-grow p-2 sm:p-6">
                        <div className="flex-grow">
                          <h3 className="text-xs sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2 line-clamp-2 min-h-[2.5em]">
                            {product.name}
                          </h3>
                          {product.freeShipping && (
                            <div className="flex items-center text-pink-600 text-[11px] gap-1">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                viewBox="0 0 24 24"
                              >
                                <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"></path>
                                <path d="M15 18H9"></path>
                                <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"></path>
                                <circle cx="17" cy="18" r="2"></circle>
                                <circle cx="7" cy="18" r="2"></circle>
                              </svg>
                              <span>Free Shipping</span>
                            </div>
                          )}

                          {/* Description */}
                          <p className="text-gray-600 text-[11px] sm:text-xs line-clamp-2">
                            {product.description}
                          </p>

                          {/* Colors */}
                          <div className="flex flex-wrap gap-1 min-h-[1.5rem]">
                            {product.color?.length > 0 ? (
                              product.color.slice(0, 3).map((c) => (
                                <span
                                  key={c.colorName}
                                  className="flex items-center gap-1 text-[10px] sm:text-xs bg-gray-50 px-1.5 py-0.5 rounded-full border border-gray-100"
                                >
                                  <span
                                    className={`inline-block w-2 h-2 rounded-full ${getColorClass(
                                      c.colorName
                                    )}`}
                                    title={c.colorName}
                                  />
                                  <span className="capitalize">
                                    {c.colorName}
                                  </span>
                                </span>
                              ))
                            ) : (
                              <div className="min-h-[1.5rem]" />
                            )}{" "}
                            {/* Blank space for alignment */}
                          </div>

                          {/* Price */}
                          <p className="font-bold text-xs sm:text-sm text-gray-900 mt-1">
                            ${product.price.toFixed(2)}
                          </p>

                          {/* Stock & Rating Row */}
                          <div className="flex justify-between items-center text-[10px] sm:text-xs mb-4">
                            <div className="flex items-center">
                              <span
                                className={`inline-block w-2 h-2 rounded-full mr-1 ${
                                  product.stock > 0
                                    ? "bg-green-500"
                                    : "bg-red-500"
                                }`}
                              />
                              {product.stock > 0
                                ? `${product.stock} in stock`
                                : "Out of stock"}
                            </div>
                            <div className="flex items-center gap-[1px]">
                              {[...Array(5)].map((_, i) => {
                                const roundedRating =
                                  Math.round((product.rating || 0) * 2) / 2;

                                if (i + 1 <= roundedRating) {
                                  // Full star
                                  return (
                                    <svg
                                      key={i}
                                      className="h-3 w-3 text-yellow-400"
                                      xmlns="http://www.w3.org/2000/svg"
                                      viewBox="0 0 20 20"
                                      fill="currentColor"
                                    >
                                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                  );
                                } else if (i + 0.5 <= roundedRating) {
                                  // Half star
                                  return (
                                    <svg
                                      key={i}
                                      className="h-3 w-3 text-yellow-400"
                                      xmlns="http://www.w3.org/2000/svg"
                                      viewBox="0 0 20 20"
                                      fill="currentColor"
                                    >
                                      <path d="M10 15.27L4.24 18.39 5.64 12.97 1.1 8.63 6.92 7.97 10 2.5V15.27z" />
                                    </svg>
                                  );
                                } else {
                                  // Empty star
                                  return (
                                    <svg
                                      key={i}
                                      className="h-3 w-3 text-gray-300"
                                      xmlns="http://www.w3.org/2000/svg"
                                      viewBox="0 0 20 20"
                                      fill="currentColor"
                                    >
                                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                  );
                                }
                              })}
                            </div>
                          </div>
                          <button className="w-full flex items-center justify-center py-1.5 sm:py-3 cursor-pointer px-2 sm:px-4 border border-transparent rounded-md sm:rounded-xl shadow-sm text-[10px] sm:text-sm font-medium text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-300">
                            View Details
                          </button>
                        </div>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default TopBrandsPage;
