import { useState, useRef, useEffect } from "react";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { axiosInstance } from "../lib/axiosInstance.js";
import { useNavigate } from "react-router-dom";

function TopElectronicsBrands() {
  const navigate = useNavigate();
  const [activeSlide, setActiveSlide] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [totalSlides, setTotalSlides] = useState(0);
  const carouselRef = useRef(null);
  const [expanded, setExpanded] = useState(false);
  const [brands, setBrands] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const cache = sessionStorage.getItem("brands");
        const cacheTime = sessionStorage.getItem("brandsTime");
        const now = Date.now();

        // Use cached data only if it's less than 10 minutes old i need to push
        if (cache && cacheTime && now - cacheTime < 10 * 60 * 1000) {
          const parsedData = JSON.parse(cache);
          setBrands(parsedData);
          return;
        }
        const response = await axiosInstance.get("/subcategory");
        const data = response.data.map((product) => ({
          id: product._id,

          name: product.subcategoryName,
          logo: product.logo,
          image: product.image,
          discount: "UP to 80% OFF",
          bgColor: "bg-pink-500",
          textColor: "text-black",
          logoBackground: "bg-white",
        }));

        setBrands(data);
        sessionStorage.setItem("brands", JSON.stringify(data));
        sessionStorage.setItem("brandsTime", now.toString());
      } catch (error) {
        console.log("Error while fetching brands: ", error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const calculateTotalSlides = () => {
      const itemsPerView = getItemsPerView();
      return Math.ceil(brands.length / itemsPerView);
    };

    setTotalSlides(calculateTotalSlides());

    window.addEventListener("resize", () => {
      setTotalSlides(calculateTotalSlides());
    });

    return () => {
      window.removeEventListener("resize", () => {
        setTotalSlides(calculateTotalSlides());
      });
    };
  }, [brands.length]);

  const handleBrandClick = (categoryName) => {
    navigate("/top-brands", {
      state: { selectedBrand: categoryName },
    });
  };
  const getItemsPerView = () => {
    if (typeof window !== "undefined") {
      if (window.innerWidth >= 1280) return 4;
      if (window.innerWidth >= 1024) return 3;
      if (window.innerWidth >= 640) return 2;
      return 1;
    }
    return 3;
  };

  const toggleView = () => {
    setExpanded(!expanded);
    setActiveSlide(0);
    if (carouselRef.current) {
      carouselRef.current.scrollLeft = 0;
    }
  };

  const handleMouseDown = (e) => {
    if (expanded) return;
    setIsDragging(true);
    setStartX(e.pageX - carouselRef.current.offsetLeft);
    setScrollLeft(carouselRef.current.scrollLeft);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - carouselRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    carouselRef.current.scrollLeft = scrollLeft - walk;
    updateActiveSlideFromScroll();
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const updateActiveSlideFromScroll = () => {
    if (!carouselRef.current) return;

    const scrollPosition = carouselRef.current.scrollLeft;
    const itemWidth = carouselRef.current.offsetWidth / getItemsPerView();
    const newActiveSlide = Math.round(scrollPosition / itemWidth);

    if (newActiveSlide !== activeSlide && newActiveSlide < totalSlides) {
      setActiveSlide(newActiveSlide);
    }
  };

  const goToSlide = (index) => {
    setActiveSlide(index);
    if (carouselRef.current) {
      const itemWidth = carouselRef.current.offsetWidth / getItemsPerView();
      carouselRef.current.scrollLeft = itemWidth * index * getItemsPerView();
    }
  };

  const scrollCarousel = (direction) => {
    if (!carouselRef.current) return;

    const itemWidth = carouselRef.current.offsetWidth / getItemsPerView();
    carouselRef.current.scrollLeft += itemWidth * direction;
  };

  const visibleBrands = expanded ? brands : brands;

  return (
    <div className="w-full mx-auto lg:px-40 md:py-12 py-6 relative">
      <div className="flex justify-between items-center mb-4 px-2">
        <h2 className="text-lg">
          Top{" "}
          <span className="text-black font-semibold pb-1">
            Electronics Brands
          </span>
        </h2>
        <button
          onClick={toggleView}
          className="group flex items-center px-4 py-2 text-sm font-medium text-slate-700 hover:text-white bg-white hover:bg-gradient-to-r hover:from-purple-500 hover:to-pink-500 border border-slate-200 rounded-full shadow-sm hover:shadow-lg transition-all duration-300 transform hover:scale-105"
        >
          {expanded ? "View Less" : "View All"}{" "}
          <ChevronRight className="h-4 w-4 ml-1" />
        </button>
      </div>

      <div className="relative px-2 md:px-12 lg:px-16">
        <div
          ref={carouselRef}
          className={`transition-all duration-300 ${
            expanded ? "overflow-visible" : "overflow-x-auto hide-scrollbar"
          } ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          style={{
            scrollBehavior: "smooth",
            WebkitOverflowScrolling: "touch",
            scrollSnapType: "x mandatory",
          }}
        >
          <div
            className={`${
              expanded
                ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3"
                : "inline-flex gap-3"
            }`}
          >
            {visibleBrands.map((brand) => (
              <div
                key={brand.id}
                className={`rounded-lg overflow-hidden shadow-md transition-transform hover:shadow-xl bg-transparent border-2 border-pink-500 ${
                  !expanded
                    ? "min-w-[140px] w-[140px] sm:min-w-[180px] sm:w-[220px] md:w-[250px]"
                    : ""
                }`}
                onClick={() => {
                  handleBrandClick(brand.name);
                  window.scrollTo(0, 0);
                }}
                style={{
                  scrollSnapAlign: "start",
                }}
              >
                <div className="p-4 flex flex-col h-full items-center">
                  <div
                    className={`text-sm font-medium mb-2 ${brand.textColor}`}
                  >
                    {brand.name}
                  </div>
                  <div
                    className={`w-12 h-12 sm:w-16 sm:h-16 rounded-md flex items-center justify-center mb-4 ${brand.logoBackground}`}
                  >
                    <img
                      src={brand.logo || "/placeholder.svg"}
                      alt={`${brand.name} logo`}
                      className="object-contain max-w-[80%] max-h-[80%]"
                    />
                  </div>

                  <div className="flex justify-center items-center mt-auto">
                    <img
                      src={brand.image || "/placeholder.svg"}
                      alt={brand.name}
                      className="object-contain h-24 sm:h-32"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Left and Right Arrows for Navigation - Only show when not expanded */}
        {!expanded && (
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
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}

export default TopElectronicsBrands;
