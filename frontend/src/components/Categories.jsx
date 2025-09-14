import React, { useState, useRef, useEffect } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";
import { axiosInstance } from "../lib/axiosInstance.js";
import { useNavigate } from "react-router-dom";

const CategoryCarousel = () => {
  const [expanded, setExpanded] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const carouselRef = useRef(null);
  const scrollIntervalRef = useRef(null);
  const scrollTimeoutRef = useRef(null);
  const isWrappingRef = useRef(false); // prevent recursive scroll handlers

  // ===== Fetch categories =====
  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/category");
      const data = response.data.map((category) => ({
        id: category._id,
        name: category.categoryName,
        image: category.image,
      }));
      setCategories(data);
    } catch (error) {
      console.error("Error fetching categories:", error);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // ===== Navigation (keep your instant scroll-to-top) =====
  const handleCategoryClick = (categoryName) => {
    window.scrollTo({ top: 0, behavior: "instant" });
    setTimeout(() => {
      navigate("/products", {
        state: { selectedCategory: categoryName },
        replace: true,
      });
    }, 0);
  };

  // ===== Infinite scroll logic =====
  const getHalfWidth = () => {
    const el = carouselRef.current;
    if (!el) return 0;
    // When not expanded we render [cats, cats] back-to-back, so half = width of first set
    return el.scrollWidth / 2;
  };

  const startAutoScroll = () => {
    const el = carouselRef.current;
    if (!el || categories.length === 0) return;

    // Clear any previous loop
    if (scrollIntervalRef.current) clearInterval(scrollIntervalRef.current);

    const speedPx = 0.7; // tweak for faster/slower auto-scroll
    scrollIntervalRef.current = setInterval(() => {
      if (!carouselRef.current) return;

      const half = getHalfWidth();
      // advance
      el.scrollLeft += speedPx;

      // wrap seamlessly when crossing half (end of first set)
      if (el.scrollLeft >= half) {
        isWrappingRef.current = true;
        // Jump back by half to the equivalent position in the first set
        el.scrollLeft = el.scrollLeft - half;
        // allow event loop to settle before accepting new scroll events
        requestAnimationFrame(() => (isWrappingRef.current = false));
      }
    }, 10);
  };

  const pauseAutoScrollTemporarily = (ms = 5000) => {
    clearInterval(scrollIntervalRef.current);
    clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => {
      if (!expanded) startAutoScroll();
    }, ms);
  };

  // Ensure loop starts/stops on expanded toggle or when categories change
  useEffect(() => {
    const el = carouselRef.current;

    if (expanded) {
      clearInterval(scrollIntervalRef.current);
    } else {
      // Reset position at start for consistency
      if (el) el.scrollLeft = 0;
      startAutoScroll();
    }

    return () => {
      clearInterval(scrollIntervalRef.current);
      clearTimeout(scrollTimeoutRef.current);
    };
  }, [expanded, categories]);

  // Wrap on manual scrolling too (drag/touch), so it feels infinite both ways
  const handleScroll = () => {
    if (isWrappingRef.current) return; // ignore programmatic jumps
    const el = carouselRef.current;
    if (!el || expanded) return;

    const half = getHalfWidth();

    // If user scrolls left past start, jump forward by half
    if (el.scrollLeft <= 0) {
      isWrappingRef.current = true;
      el.scrollLeft = el.scrollLeft + half;
      requestAnimationFrame(() => (isWrappingRef.current = false));
      return;
    }

    // If user scrolls right past half, jump back by half
    if (el.scrollLeft >= half) {
      isWrappingRef.current = true;
      el.scrollLeft = el.scrollLeft - half;
      requestAnimationFrame(() => (isWrappingRef.current = false));
    }
  };

  // Hover/touch pause/resume
  const handleTouchStart = () => pauseAutoScrollTemporarily();
  const handleTouchMove = () => pauseAutoScrollTemporarily();
  const handleMouseEnter = () => clearInterval(scrollIntervalRef.current);
  const handleMouseLeave = () => {
    if (!expanded) startAutoScroll();
  };

  // ===== Render =====
  const renderList = () => {
    if (loading) {
      return <>Loading...</>;
    }

    // In carousel (non-expanded) mode, duplicate the list to enable seamless wrap
    const list = expanded ? categories : [...categories, ...categories];

    return list.map((category, index) => (
      <div
        key={`${category.id}-${index}`}
        className="flex flex-col items-center flex-shrink-0 w-32 cursor-pointer"
        onClick={() => handleCategoryClick(category.name)}
      >
        <div className="w-20 h-20 md:w-24 md:h-24 rounded-full border-2 border-pink-500 flex items-center justify-center hover:border-black transition-colors duration-500">
          <img
            src={category.image}
            alt={category.name}
            className="w-20 h-20 object-contain rounded-full"
            draggable={false}
          />
        </div>
        <span className="text-sm text-center mt-2">{category.name}</span>
      </div>
    ));
  };

  return (
    <div className="lg:px-40 px-2 mx-auto py-6">
      <div className="flex justify-between items-center mb-6 relative">
        <div className="relative">
          <h2 className="text-lg font-medium">
            Shop From{" "}
            <span className="text-black font-semibold">Top Categories</span>
          </h2>
        </div>
        <button
          onClick={() => {
            // snap back to start before switching to expanded for a clean layout
            if (!expanded && carouselRef.current) {
              carouselRef.current.scrollLeft = 0;
            }
            setExpanded((v) => !v);
          }}
          className="group flex items-center px-4 py-2 text-sm font-medium text-slate-700 hover:text-white bg-white hover:bg-gradient-to-r hover:from-purple-500 hover:to-pink-500 border border-slate-200 rounded-full shadow-sm hover:shadow-lg transition-all duration-300 transform hover:scale-105"
        >
          {expanded ? "View Less" : "View All"}
          {expanded ? (
            <ChevronDown className="w-4 h-4 ml-1" />
          ) : (
            <ChevronRight className="w-4 h-4 ml-1" />
          )}
        </button>
      </div>

      <div
        ref={carouselRef}
        className={`pb-4 scrollbar-hide ${
          expanded ? "overflow-visible" : "overflow-x-auto"
        }`}
        style={{
          WebkitOverflowScrolling: "touch",
          scrollBehavior: "auto", // avoid built-in smoothing for our precise wrapping
          scrollbarWidth: "none",
        }}
        onScroll={handleScroll}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
      >
        <div
          className={`${
            expanded
              ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6"
              : "flex space-x-3 md:space-x-6"
          }`}
        >
          {renderList()}
        </div>
      </div>

      <style>{`.scrollbar-hide::-webkit-scrollbar { display: none; }`}</style>
    </div>
  );
};

export default CategoryCarousel;
