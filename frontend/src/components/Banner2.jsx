import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { axiosInstance } from "../lib/axiosInstance.js";
import { Link } from "react-router-dom";

export default function Banner2({ products }) {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axiosInstance.get("/category");
        const categories = response.data
          .map((item) =>
            item.categoryName !== "Phone" ? item.categoryName : null
          )
          .filter(Boolean)
          .slice(0, 3);

        if (products?.length) {
          const categoryProductData = categories.map((category) => {
            const items = products
              .filter((p) => p.parentCategory === category)
              .slice(0, 4)
              .map((item) => ({
                id: item._id,
                name: item.name,
                modelName: item.modelName?.replace(/\s+/g, "-"),
                image: item.images?.[0]?.url,
              }));

            return { title: category, items };
          });

          setCategories(categoryProductData);
        }
      } catch (err) {
        console.error("Failed to fetch categories:", err);
      }
    };

    fetchCategories();
  }, [products]);

  return (
    <section className="bg-gradient-to-br from-[#f0f4ff] to-[#e8eaff] px-4 md:px-12 lg:px-40 py-16">
      <div className="max-w-full">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-semibold text-gray-800 mb-4">
            All Accessories
          </h1>
          <p className="text-lg text-gray-500">
            Elevate your experience with premium accessories.
          </p>
        </div>

        {/* Category blocks */}
        <div className="grid gap-10 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {categories.map((category, index) => (
            <motion.div
              key={index}
              className="bg-white rounded-xl border border-gray-100 shadow-sm p-6"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{
                once: true,
                amount: 0.2,
                margin: "0px 0px -100px 0px",
              }}
              transition={{
                duration: 0.55,
                delay: index * 0.25, // first → second → third
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <h2 className="text-xl font-semibold text-gray-800 mb-6">
                {category.title}
              </h2>

              <div className="grid grid-cols-2 gap-4">
                {category.items.map((item, idx) => (
                  <Link
                    to={`/products/${item.modelName}`}
                    key={idx}
                    className="group"
                  >
                    <div className="w-full aspect-square min-h-[120px] bg-gray-50 rounded-lg flex items-center justify-center border border-gray-200 overflow-hidden transition hover:shadow-md">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                    <p className="text-sm text-gray-700 mt-2 line-clamp-2 group-hover:text-blue-600 transition">
                      {item.name}
                    </p>
                  </Link>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
