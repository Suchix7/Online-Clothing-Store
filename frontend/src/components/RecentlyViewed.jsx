import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, ChevronLeft } from "lucide-react";
import axios from "axios";
import { axiosInstance } from "../lib/axiosInstance.js";

const RecentlyViewed = () => {
  const [recentProducts, setRecentProducts] = useState([]);
  const carouselRef = useRef(null);

  useEffect(() => {
    const fetchAndValidateProducts = async () => {
      const recentlyViewed =
        JSON.parse(localStorage.getItem("recentlyViewed")) || [];
      if (recentlyViewed.length === 0) {
        setRecentProducts([]);
        return;
      }

      // Reverse the array to show the most recent first
      const uniqueProductIds = [
        ...new Set(recentlyViewed.map((p) => p._id)),
      ].reverse();

      try {
        const response = await axiosInstance.post("/validate", {
          ids: uniqueProductIds,
        });

        const validProducts = response.data.products;

        // Filter the recentlyViewed list to only include valid products
        const filteredProducts = recentlyViewed.filter((localProduct) =>
          validProducts.some(
            (validatedProduct) => validatedProduct._id === localProduct._id
          )
        );

        // Update localStorage with the validated products
        localStorage.setItem(
          "recentlyViewed",
          JSON.stringify(filteredProducts)
        );

        setRecentProducts(filteredProducts.reverse());
      } catch (error) {
        console.error("Failed to validate recently viewed products:", error);
        // Fallback: clear the local storage to prevent future errors
        localStorage.removeItem("recentlyViewed");
        setRecentProducts([]);
      }
    };

    fetchAndValidateProducts();
  }, []);

  const scrollCarousel = (direction) => {
    if (!carouselRef.current) return;
    const scrollAmount = 200;
    carouselRef.current.scrollBy({
      left: direction * scrollAmount,
      behavior: "smooth",
    });
  };

  if (recentProducts.length === 0) return null;

  return (
    <section className="w-full lg:px-40 md:px-8 py-6 bg-gray-50">
      <div className="w-full">
        <div className="flex justify-between items-center mb-4 px-2">
          <h2 className="text-lg md:text-xl font-bold text-gray-900">
            Recently Viewed
          </h2>
        </div>

        <div className="relative px-2 md:px-12 lg:px-16">
          {/* Left Arrow */}
          <div className="absolute -left-0 md:-left-6 top-1/2 transform -translate-y-1/2 z-10">
            <button
              onClick={() => scrollCarousel(-1)}
              className="bg-white p-3 rounded-full text-gray-800 hover:text-gray-600 transition shadow-[0_2px_8px_rgba(0,0,0,0.15)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.2)] hidden md:block"
              aria-label="Scroll left"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          </div>

          {/* Right Arrow */}
          <div className="absolute -right-0 md:-right-6 top-1/2 transform -translate-y-1/2 z-10">
            <button
              onClick={() => scrollCarousel(1)}
              className="bg-white p-3 rounded-full text-gray-800 hover:text-gray-600 transition shadow-[0_2px_8px_rgba(0,0,0,0.15)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.2)] hidden md:block"
              aria-label="Scroll right"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </div>

          {/* Carousel */}
          <div
            ref={carouselRef}
            className="inline-flex gap-3 overflow-x-auto pb-2 touch-pan-x scroll-smooth w-full carousel-container"
          >
            {recentProducts.map((product) => (
              <Link
                to={`/products/${product.modelName?.replace(/\s+/g, "-")}`}
                key={product._id}
                className="bg-white border border-gray-200 rounded-xl p-3 hover:shadow-md transition-shadow flex-none min-w-[140px] w-[140px] sm:min-w-[180px] sm:w-[220px] md:w-[250px] scroll-snap-align-start"
                style={{ scrollSnapAlign: "start" }}
              >
                {/* Image */}
                <div className="flex justify-center items-center h-24 sm:h-40 md:h-48 mb-3">
                  <img
                    src={product.images?.[0]?.url || "/placeholder.svg"}
                    alt={product.name}
                    className="max-h-full max-w-full object-contain"
                    onError={(e) => {
                      e.target.src = "/placeholder.svg";
                    }}
                  />
                </div>

                {/* Details */}
                <div className="flex flex-col text-left space-y-1">
                  <h3 className="font-medium text-xs sm:text-sm text-gray-900 line-clamp-2">
                    {product.name}
                  </h3>
                  <p className="font-bold text-xs sm:text-sm text-gray-800">
                    ${product.sellingPrice?.toFixed(2) ?? "0.00"}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .carousel-container {
          scroll-snap-type: x mandatory;
        }

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

export default RecentlyViewed;
