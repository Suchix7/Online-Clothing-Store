import React, { useState, useEffect, useRef } from "react";
import { ChevronRight, ChevronDown, ChevronLeft } from "lucide-react";
import { Link } from "react-router-dom";

const ProductsPage = ({ product, category }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (product?.length) {
          const cachedData = sessionStorage.getItem(
            `productListing_${category}`
          );
          const cachedTime = sessionStorage.getItem(
            `productListingTime_${category}`
          );
          const now = Date.now();

          // Use cached data if it exists and is less than 5 minutes old
          if (
            cachedData &&
            cachedTime &&
            now - parseInt(cachedTime) < 5 * 60 * 1000
          ) {
            setProducts(JSON.parse(cachedData));
            setLoading(false);
            return;
          }

          const data = product.map((product) => ({
            id: product._id,
            modelName: product.modelName?.replace(/\s+/g, "-"),
            name: product.name,
            price: product.sellingPrice,
            currentPrice: product.sellingPrice,
            originalPrice: product.originalPrice || product.sellingPrice * 1.2,
            discount:
              "Save " +
                Math.round(
                  ((product.sellingPrice * 1.2 - product.sellingPrice) /
                    product.costPrice) *
                    100
                ) +
                "%" || 10,
            savings:
              product.sellingPrice * 1.2 - product.sellingPrice || "₹500",
            category: product.parentCategory,
            subcategory: product.parentSubcategory,
            color: product.color,
            size: product.size,
            rating: product.rating || 0, // ✅ real rating from DB
            reviews: product.reviews || 0,
            image: product.images[0]?.url,
            inStock: product.stock > 0,
            stock: product.stock || 0,
            description: product.description,
            freeShipping: product.freeShipping || true,
          }));

          // Store data in session storage with category-specific keys
          sessionStorage.setItem(
            `productListing_${category}`,
            JSON.stringify(data)
          );
          sessionStorage.setItem(
            `productListingTime_${category}`,
            now.toString()
          );

          setProducts(data);
        }
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [product, category]);

  if (loading) {
    return <div className="text-center py-8">Loading products...</div>;
  }

  return <ProductListing products={products} category={category} />;
};
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
const ProductListing = ({ products, category }) => {
  const [showAll, setShowAll] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const carouselRef = useRef(null);
  const [filteredProducts, setFilteredProducts] = useState([]);

  // Reset states when category changes
  useEffect(() => {
    setShowAll(false);
    if (carouselRef.current) {
      carouselRef.current.scrollLeft = 0;
    }

    // Filter products based on category
    const filtered = products.filter((item) => item.category === category);
    setFilteredProducts(filtered);
  }, [category, products]);

  // Add new useEffect for initial scroll position
  useEffect(() => {
    if (carouselRef.current) {
      carouselRef.current.scrollLeft = 0;
    }
  }, []);

  // Add scroll position reset on mount and category change
  useEffect(() => {
    const resetScroll = () => {
      if (carouselRef.current) {
        carouselRef.current.scrollLeft = 0;
        // Force a reflow to ensure scroll position is reset
        carouselRef.current.offsetHeight;
      }
    };

    resetScroll();
    // Add event listener for orientation change
    window.addEventListener("orientationchange", resetScroll);

    return () => {
      window.removeEventListener("orientationchange", resetScroll);
    };
  }, [category]);

  const handleToggleView = () => {
    setShowAll(!showAll);
    if (!showAll) {
      const productListSection = document.getElementById(
        `product-list-${category}`
      );
      productListSection?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const getItemsPerView = () => {
    if (typeof window !== "undefined") {
      if (window.innerWidth >= 1280) return 5;
      if (window.innerWidth >= 1024) return 4;
      if (window.innerWidth >= 768) return 3;
      if (window.innerWidth >= 640) return 2;
      return 1;
    }
    return 5;
  };

  const handleMouseDown = (e) => {
    if (showAll) return;
    setIsDragging(true);
    setStartX(e.pageX - carouselRef.current.offsetLeft);
    setScrollLeft(carouselRef.current.scrollLeft);
  };

  const handleMouseMove = (e) => {
    if (!isDragging || showAll) return;
    e.preventDefault();
    const x = e.pageX - carouselRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    carouselRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const scrollCarousel = (direction) => {
    if (!carouselRef.current || showAll) return;
    const scrollAmount = 120; // Width of one item
    carouselRef.current.scrollBy({
      left: direction * scrollAmount,
      behavior: "smooth",
    });
  };

  if (!products || products.length === 0) {
    return <div className="text-center py-8">No products available</div>;
  }

  const displayedProducts = showAll
    ? filteredProducts.slice(0, 15)
    : filteredProducts.slice(0, 10);

  return (
    <div className="relative w-full">
      <div
        className="w-full mx-auto lg:px-40 md:px-8 py-6"
        id={`product-list-${category}`}
      >
        <div className="flex justify-between items-center pb-2 mb-4 px-2">
          <h2 className="text-lg md:text-xl font-medium text-black">
            Best deals for <span className="font-semibold">{category}</span>
          </h2>
          {filteredProducts.length > 4 && (
            <button
              onClick={handleToggleView}
              className="group flex items-center px-4 py-2 text-sm font-medium text-slate-700 hover:text-white bg-white hover:bg-gradient-to-r hover:from-purple-500 hover:to-pink-500 border border-slate-200 rounded-full shadow-sm hover:shadow-lg transition-all duration-300 transform hover:scale-105"
            >
              {showAll ? "View Less" : "View All"}
              {showAll ? (
                <ChevronDown className="w-3 h-3 ml-1" />
              ) : (
                <ChevronRight className="w-3 h-3 ml-1" />
              )}
            </button>
          )}
        </div>

        <div className="relative px-2 md:px-12 lg:px-16">
          <div
            ref={carouselRef}
            className={`w-full ${
              showAll ? "" : "overflow-x-auto touch-pan-x"
            } ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
            style={{
              scrollSnapType: "x mandatory",
              scrollBehavior: "smooth",
              WebkitOverflowScrolling: "touch",
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
          >
            <div
              className={`${
                showAll
                  ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3"
                  : "inline-flex gap-3"
              }`}
              style={{
                paddingLeft: showAll ? "0" : "8px",
                paddingRight: showAll ? "0" : "8px",
              }}
            >
              {displayedProducts.map((product, index) => (
                <Link
                  to={`/products/${product.modelName}`}
                  key={product.id}
                  className={`border border-gray-200 rounded-xl p-3 bg-white hover:shadow-lg transition-shadow flex-none ${
                    !showAll
                      ? "min-w-[140px] w-[140px] sm:min-w-[180px] sm:w-[220px] md:w-[250px]"
                      : ""
                  }`}
                  style={{ scrollSnapAlign: "start" }}
                >
                  {/* Image Section */}
                  <div className="flex justify-center items-center h-24 sm:h-40 md:h-48 mb-3">
                    <img
                      src={product.image || "/placeholder.svg"}
                      alt={product.name}
                      className="max-h-full max-w-full object-contain"
                      loading={index < 4 ? "eager" : "lazy"}
                      onError={(e) => {
                        e.target.src = "/placeholder.svg";
                      }}
                    />
                  </div>

                  {/* Product Details */}
                  <div className="flex flex-col text-left space-y-1">
                    <h3 className="font-medium text-xs sm:text-sm text-gray-900 line-clamp-2">
                      {product.name}
                    </h3>

                    {/* Free Shipping */}
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
                            <span className="capitalize">{c.colorName}</span>
                          </span>
                        ))
                      ) : (
                        <div className="min-h-[1.5rem]" />
                      )}{" "}
                      {/* Blank space for alignment */}
                    </div>

                    {/* Price */}
                    <p className="font-bold text-xs sm:text-sm text-gray-900 mt-1">
                      ${product.currentPrice.toFixed(2)}
                    </p>

                    {/* Stock & Rating Row */}
                    <div className="flex justify-between items-center text-[10px] sm:text-xs mt-1">
                      <div className="flex items-center">
                        <span
                          className={`inline-block w-2 h-2 rounded-full mr-1 ${
                            product.stock > 0 ? "bg-green-500" : "bg-red-500"
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
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {!showAll && filteredProducts.length > 4 && (
            <>
              <div className="absolute -left-0 md:-left-6 top-1/2 transform -translate-y-1/2 z-10">
                <button
                  onClick={() => scrollCarousel(-1)}
                  className="bg-white p-3 rounded-full text-gray-800 hover:text-gray-600 transition shadow-[0_2px_8px_rgba(0,0,0,0.15)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.2)] hidden md:block"
                  aria-label="Scroll left"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
              </div>
              <div className="absolute -right-0 md:-right-6 top-1/2 transform -translate-y-1/2 z-10">
                <button
                  onClick={() => scrollCarousel(1)}
                  className="bg-white p-3 rounded-full text-gray-800 hover:text-gray-600 transition shadow-[0_2px_8px_rgba(0,0,0,0.15)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.2)] hidden md:block"
                  aria-label="Scroll right"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <style>{`
        .touch-pan-x {
          touch-action: auto;
          -webkit-overflow-scrolling: touch;
          scroll-snap-type: x mandatory;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .touch-pan-x::-webkit-scrollbar {
          display: none;
        }
        .clamp-2-lines {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
          
      `}</style>
    </div>
  );
};

export default ProductsPage;
