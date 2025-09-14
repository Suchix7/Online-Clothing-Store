import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

// Example data structure your DB might return
const AdSection = ({ product }) => {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    setProducts(
      product
        .filter((item) => item.extras == "ad")
        .map((item) => {
          return {
            id: item._id,
            name: item.name,
            imageUrl: item.images[0].url,
            description: item.description,
            bgColor: "#0D223A",
          };
        })
    );
  }, [product]);

  return (
    <section className="mb-[32px] mt-[32px] flex flex-col md:flex-row  md:space-y-0 sm:h-screen">
      {products.length > 0 ? (
        products.map((product) => (
          <div
            key={product.id}
            className={`flex-1 bg-[${product.bgColor}] text-white relative flex flex-col items-center justify-center p-6 md:p-10`}
            style={{ backgroundColor: product.bgColor }}
          >
            <img
              src={product.imageUrl}
              alt={`${product.name} Product`}
              className="w-full h-auto object-contain max-h-[150px] md:max-h-[300px]"
            />
            <div className="absolute bottom-6 left-6">
              <h2 className="text-xl font-semibold">{product.name}</h2>
              <p className="text-sm text-gray-200 truncate w-[250px] overflow-hidden">
                {product.description || "Discover our latest collection."}
              </p>
              <div className="mt-4 space-x-2">
                <Link
                  to={`/products/${product.id}`}
                  className="inline-block px-4 py-2 bg-white text-black font-medium text-sm rounded hover:bg-gray-100 transition"
                >
                  SHOP NOW→
                </Link>
              </div>
            </div>
          </div>
        ))
      ) : (
        <h2 className="text-center w-full font-bold text-3xl animate-pulse flex items-center justify-center">
          No products found.
        </h2>
      )}
    </section>
  );
};

export default AdSection;
