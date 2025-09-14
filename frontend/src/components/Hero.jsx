import React, { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

const HeroCarousel = ({ products }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [carouselData, setCarouselData] = useState([]);
  const slideInterval = useRef(null);
  const carouselRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);

  useEffect(() => {
    const generateGradient = () => {
      const colors = [
        "from-indigo-500 to-blue-600",
        "from-purple-600 to-pink-500",
        "from-amber-500 to-orange-600",
        "from-emerald-500 to-teal-600",
        "from-rose-500 to-pink-500",
        "from-violet-600 to-indigo-600",
      ];
      return colors[Math.floor(Math.random() * colors.length)];
    };

    if (products?.length) {
      const filteredData = products.filter(
        (item) => item.extras == "caraousel"
      );
      const data = filteredData.map((item) => ({
        id: item._id,
        modelName: item.modelName.replace(/\s+/g, "-"),
        title: item.name,
        subtitle:
          window.innerWidth > 728
            ? item.description.substring(0, 100) + "..."
            : item.description.substring(0, 60) + "...",
        price: `$${formatPrice(item.sellingPrice)}`,
        image: item.images[0].url,
        bgColor: generateGradient(),
      }));

      setCarouselData(data);
    }
  }, [products]);

  const totalSlides = carouselData.length;

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev === totalSlides - 1 ? 0 : prev + 1));
    setDragOffset(0);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? totalSlides - 1 : prev - 1));
    setDragOffset(0);
  };

  const goToSlide = (slideIndex) => {
    setCurrentSlide(slideIndex);
    setDragOffset(0);
  };

  // Mouse drag functionality
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.clientX);
    setCurrentX(e.clientX);
    setIsPaused(true);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.clientX;
    const diff = x - currentX;
    setCurrentX(x);
    setDragOffset(dragOffset + diff);
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    setIsPaused(false);

    // Determine if we should change slide based on drag distance
    const threshold = 100;
    if (dragOffset > threshold) {
      prevSlide();
    } else if (dragOffset < -threshold) {
      nextSlide();
    } else {
      setDragOffset(0);
    }
  };

  const handleMouseLeave = () => {
    if (isDragging) {
      setIsDragging(false);
      setDragOffset(0);
      setIsPaused(false);
    }
  };

  // Touch swipe functionality
  const handleTouchStart = (e) => {
    setIsPaused(true);
    setStartX(e.touches[0].clientX);
    setCurrentX(e.touches[0].clientX);
  };

  const handleTouchMove = (e) => {
    const x = e.touches[0].clientX;
    const diff = x - currentX;
    setCurrentX(x);
    setDragOffset(dragOffset + diff);
  };

  const handleTouchEnd = () => {
    setIsPaused(false);
    const threshold = 50;
    if (dragOffset > threshold) {
      prevSlide();
    } else if (dragOffset < -threshold) {
      nextSlide();
    } else {
      setDragOffset(0);
    }
  };

  const formatPrice = (amount) => {
    const parts = amount.toFixed(2).split(".");
    let integerPart = parts[0];
    const decimalPart = parts[1];

    // Format integer part using Nepali/Indian number system
    let lastThree = integerPart.slice(-3);
    const otherNumbers = integerPart.slice(0, -3);

    if (otherNumbers !== "") {
      lastThree = "," + lastThree;
    }

    const formatted =
      otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + lastThree;

    return formatted + "." + decimalPart;
  };

  // Set up auto-sliding
  useEffect(() => {
    if (!isPaused && totalSlides > 0) {
      slideInterval.current = setInterval(() => {
        nextSlide();
      }, 5000);
    }

    return () => {
      if (slideInterval.current) {
        clearInterval(slideInterval.current);
      }
    };
  }, [isPaused, currentSlide, totalSlides]);

  if (carouselData.length === 0) {
    return (
      <div className="w-full h-[400px] bg-gray-100 animate-pulse flex items-center justify-center">
        <p className="text-gray-500">Loading featured products...</p>
      </div>
    );
  }

  return (
    <div
      className="relative w-full overflow-hidden group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      ref={carouselRef}
    >
      <div
        className="flex transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] h-[450px] sm:h-[500px] lg:h-[550px] cursor-grab active:cursor-grabbing"
        style={{
          transform: `translateX(calc(-${
            currentSlide * 100
          }% + ${dragOffset}px))`,
          transition: isDragging
            ? "none"
            : "transform 700ms cubic-bezier(0.16,1,0.3,1)",
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {carouselData.map((slide, index) => (
          <div
            key={slide.id}
            className={`w-full h-full flex-shrink-0 relative p-4 sm:p-8 bg-gradient-to-br ${slide.bgColor}`}
          >
            <div className="container mx-auto px-4 h-full flex flex-col md:flex-row justify-between items-center relative z-10">
              {/* Text Content */}
              <div className="w-full md:w-1/2 text-white z-10 mb-8 md:mb-0 space-y-2 sm:space-y-4 md:space-y-6">
                <div className="inline-block max-w-xl px-4 py-1 rounded-full border border-white/30 backdrop-blur-sm">
                  <p className="text-sm text-white">{slide.subtitle}</p>
                </div>

                <h2
                  className={`clamp-2-lines text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight transition-opacity duration-500 delay-75 ${
                    currentSlide === index ? "opacity-100" : "opacity-0"
                  }`}
                >
                  {slide.title}
                </h2>

                <p
                  className={`text-lg sm:text-xl md:text-2xl font-semibold transition-opacity duration-500 delay-150 ${
                    currentSlide === index ? "opacity-100" : "opacity-0"
                  }`}
                >
                  {slide.price}
                </p>
                <div
                  className={`transition-opacity duration-500 delay-200 ${
                    currentSlide === index ? "opacity-100" : "opacity-0"
                  }`}
                >
                  <Link to={`/products/${slide.modelName}`}>
                    <button className="bg-white text-gray-900 text-xs sm:text-sm px-6 sm:px-8 py-2 sm:py-3 rounded-full font-medium hover:bg-blue-50 transition-all mt-2 sm:mt-4 shadow-lg hover:shadow-xl active:scale-95 flex items-center gap-2 cursor-pointer">
                      Shop Now
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </button>
                  </Link>
                </div>
              </div>

              {/* Product Image */}
              <div className="w-full md:w-1/2 flex justify-center items-center relative md:mt-0 -mt-8 -z-0 md:z-10">
                <div className="relative group-hover:scale-105 transition-transform duration-500 w-full max-w-md">
                  <img
                    draggable={false}
                    src={slide.image || "/placeholder.svg"}
                    alt={slide.title}
                    className={`object-contain w-full h-auto max-h-[220px] sm:max-h-[280px] md:max-h-[320px] lg:max-h-[380px] drop-shadow-2xl transition-opacity duration-500 ${
                      currentSlide === index ? "opacity-100" : "opacity-0"
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows - Always visible on desktop, hidden on mobile */}
      <button
        onClick={prevSlide}
        className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm items-center justify-center hover:bg-white/30 transition-all z-10 opacity-0 group-hover:opacity-100 shadow-lg"
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-6 h-6 text-white" />
      </button>
      <button
        onClick={nextSlide}
        className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm items-center justify-center hover:bg-white/30 transition-all z-10 opacity-0 group-hover:opacity-100 shadow-lg"
        aria-label="Next slide"
      >
        <ChevronRight className="w-6 h-6 text-white" />
      </button>

      {/* Mobile Navigation Arrows - Always visible on mobile */}
      <button
        onClick={prevSlide}
        className="sm:hidden absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-all z-10 shadow-lg"
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-5 h-5 text-white" />
      </button>
      <button
        onClick={nextSlide}
        className="sm:hidden absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-all z-10 shadow-lg"
        aria-label="Next slide"
      >
        <ChevronRight className="w-5 h-5 text-white" />
      </button>

      {/* Pagination Dots */}
      <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 flex space-x-2 z-10">
        {carouselData.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`h-2 rounded-full transition-all duration-300 ${
              currentSlide === index
                ? "w-6 bg-white scale-110"
                : "w-3 bg-white/50 hover:bg-white/70"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default HeroCarousel;
