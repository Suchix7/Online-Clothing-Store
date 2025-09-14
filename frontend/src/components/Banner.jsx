import React from "react";
import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";

const Banner = ({ product }) => {
  const bgColors = ["bg-red-900", "bg-gray-800", "bg-blue-900", "bg-gray-900"];
  const [products, setProducts] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const bannerRef = useRef(null);
  const transitionDuration = 1500; // Slower transition (1.5 seconds)

  useEffect(() => {
    setProducts(
      product
        ?.filter((item) => item.extras == "banner")
        .slice(0, 5)
        .map((item, index) => {
          return {
            id: item._id,
            modelName: item.modelName.replace(/\s+/g, "-"),
            name: item.name,
            tagline: item.description.substring(0, 50) + "...",
            imageUrl: item.images[0].url,
            color: bgColors[index % bgColors.length], // cycle through colors if needed
          };
        })
    );
  }, [product]);

  // Auto-scroll with slower interval
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % products?.length);
    }, 7000); // Change every 7 seconds
    return () => clearInterval(interval);

    bgColors.forEach((item) => {});
  }, [products?.length]);

  // Handle touch events for swipe
  const handleTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStart - touchEnd > 50) {
      // Swipe left
      setCurrentIndex((prev) => (prev === products.length - 1 ? 0 : prev + 1));
    }

    if (touchStart - touchEnd < -50) {
      // Swipe right
      setCurrentIndex((prev) => (prev === 0 ? products.length - 1 : prev - 1));
    }
  };

  // Handle mouse drag for desktop
  const handleMouseDown = (e) => {
    setTouchStart(e.clientX);
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleMouseMove = (e) => {
    setTouchEnd(e.clientX);
  };

  const handleMouseUp = () => {
    if (touchStart - touchEnd > 100) {
      // Swipe left
      setCurrentIndex((prev) => (prev === products.length - 1 ? 0 : prev + 1));
    }

    if (touchStart - touchEnd < -100) {
      // Swipe right
      setCurrentIndex((prev) => (prev === 0 ? products.length - 1 : prev - 1));
    }
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  };

  return (
    <div
      ref={bannerRef}
      className="relative w-full h-[600px] overflow-hidden select-none mt-6 mb-6"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
    >
      {products?.map((product, index) => (
        <div
          key={product.id}
          className={`absolute inset-0 flex flex-col md:flex-row items-center justify-center transition-opacity duration-[${transitionDuration}ms] ease-in-out ${
            product.color
          } ${
            index === currentIndex
              ? "opacity-100"
              : "opacity-0 pointer-events-none"
          }`}
          style={{ transitionDuration: `${transitionDuration}ms` }}
        >
          {/* Text Content - Left Side */}
          <div className="w-full md:w-1/2 px-8 md:px-16 text-white space-y-6 z-10">
            <h2 className="text-4xl md:text-6xl font-light tracking-tight clamp-2-lines">
              {product.name}
            </h2>
            <p className="text-xl md:text-2xl font-light text-gray-300">
              {product.tagline}
            </p>
            <Link
              to={`/products/${product.modelName}`}
              className="px-4 py-2 bg-transparent border-3 border-white text-white rounded-2xl font-semibold hover:bg-white hover:text-gray-900 transition-colors duration-400 ease-in-out hover:shadow-lg"
            >
              Shop Now
            </Link>
          </div>

          {/* Product Image - Right Side */}
          <div className="w-full md:w-1/2 h-1/2 md:h-full flex items-center justify-center p-8">
            <img
              src={product.imageUrl}
              alt={product.name}
              className="object-contain h-full w-full transition-transform duration-500 hover:scale-105"
              draggable="false"
            />
          </div>
        </div>
      ))}

      {/* Indicator Dots */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center space-x-2 z-10">
        {products?.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index === currentIndex ? "bg-white w-6" : "bg-gray-400"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default Banner;
