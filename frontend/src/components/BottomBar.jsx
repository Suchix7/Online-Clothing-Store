import React, { useState, useEffect } from "react";
import { FaChevronDown, FaChevronUp, FaTimes } from "react-icons/fa";
import { axiosInstance } from "../lib/axiosInstance";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

const BottomBar = ({ products }) => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedMobileCategory, setSelectedMobileCategory] = useState(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const cache = sessionStorage.getItem("categoryProductData");
        const cacheTime = sessionStorage.getItem("categoryProductTime");
        const now = Date.now();

        if (cache && cacheTime && now - cacheTime < 10 * 60 * 1000) {
          const parsedData = JSON.parse(cache);
          setCategories(parsedData);
          return;
        }
        const response = await axiosInstance.get("/category");
        const categories = response.data.map((item) => item.categoryName);

        if (products?.length) {
          const categoryProductData = categories.map((category) => {
            let productsArray = products
              .filter((item) => item.parentCategory === category)
              .map((item) => ({
                id: item._id,
                modelName: item.modelName.replace(/\s+/g, "-"),
                name: item.name,
                image: item.images[0]?.url,
              }))
              .slice(0, 12);

            return {
              name: category,
              items: productsArray,
            };
          });

          setCategories(categoryProductData);
          sessionStorage.setItem(
            "categoryProductData",
            JSON.stringify(categoryProductData)
          );
          sessionStorage.setItem("categoryProductTime", now.toString());
        }
      } catch (error) {
        console.log("Error while fetching categories/products:", error);
      }
    };

    fetchCategories();
  }, [products]);

  const handleCategory = (categoryName) => {
    navigate("/products", {
      state: { selectedCategory: categoryName },
    });
  };

  window.addEventListener("scroll", () => {
    setActiveCategory(null);
  });

  return (
    <div className="w-full bg-white">
      {/* Desktop View */}
      <div className="hidden md:flex flex-wrap justify-center gap-4 px-6 py-1">
        {categories.map((category, index) => (
          <div
            key={index}
            className="relative group flex-1 min-w-[110px] max-w-[130px]"
            onMouseEnter={() => setActiveCategory(index)}
            onMouseLeave={() => setActiveCategory(null)}
          >
            <button
              className="flex items-center justify-between gap-2 px-4 py-2 border-0 w-full transition-colors hover:bg-gray-100 rounded-lg"
              onClick={() => handleCategory(category.name)}
            >
              <span className="truncate">{category.name}</span>
              <FaChevronDown className="text-xs" />
            </button>

            {activeCategory === index && (
              <AnimatePresence>
                {category && (
                  <motion.div
                    key="categoryWrapper"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.4 }}
                    className="fixed left-0 w-full bg-white shadow-xl z-50 border-t border-gray-200"
                  >
                    <div className="container mx-auto py-6 px-4">
                      <motion.div
                        key="categoryContent"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4, delay: 0.4 }}
                        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-6"
                      >
                        {category.items.map((item) => (
                          <Link
                            to={`/products/${item.modelName}`}
                            key={item.id}
                            className="group hover:shadow-xl transition-all rounded-lg overflow-hidden bg-pink-500 duration-500"
                          >
                            <div className="flex flex-col items-center p-3">
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-full h-32 object-contain mb-3 group-hover:scale-105 transition-transform"
                              />
                              <span className="text-sm font-medium text-center text-white clamp-2-lines">
                                {item.name}
                              </span>
                            </div>
                          </Link>
                        ))}
                      </motion.div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </div>
        ))}
      </div>

      {/* Mobile View */}
      <div className="hidden md:hidden">
        <button
          className="w-full flex items-center justify-between px-4 py-3 bg-gray-100"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <span>Categories</span>
          {mobileMenuOpen ? <FaChevronUp /> : <FaChevronDown />}
        </button>

        {mobileMenuOpen && (
          <div className="bg-white shadow-lg">
            {categories.map((category, index) => (
              <div key={index} className="border-b border-gray-200">
                <button
                  className="w-full flex items-center justify-between px-4 py-3"
                  onClick={() =>
                    setSelectedMobileCategory(
                      selectedMobileCategory === index ? null : index
                    )
                  }
                >
                  <span>{category.name}</span>
                  {selectedMobileCategory === index ? (
                    <FaChevronUp className="text-xs" />
                  ) : (
                    <FaChevronDown className="text-xs" />
                  )}
                </button>

                {selectedMobileCategory === index && (
                  <div className="bg-gray-50 px-4 py-2">
                    <div className="grid grid-cols-2 gap-3">
                      {category.items.slice(0, 6).map((item) => (
                        <Link
                          to={`/products/${item.id}`}
                          key={item.id}
                          className="p-2 bg-white rounded shadow-sm"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <div className="flex flex-col items-center">
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-16 h-16 object-contain mb-1"
                            />
                            <span className="text-xs text-center font-medium clamp-2-lines">
                              {item.name}
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                    {category.items.length > 6 && (
                      <button
                        className="w-full mt-3 text-center text-sm text-blue-600"
                        onClick={() => {
                          handleCategory(category.name);
                          setMobileMenuOpen(false);
                        }}
                      >
                        View all {category.items.length} products
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BottomBar;
