import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { axiosInstance } from "../lib/axiosInstance.js";
import { AnimatePresence, motion } from "framer-motion";
import SvgLoader from "./SvgLoader";

function TopBrandsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const brand = location.state?.selectedBrand || topBrandsPageState.cache.brand;

  useEffect(() => {
    if (!brand) {
      navigate("/", { replace: true });
      return;
    }

    // Initialize global state
    window.topBrandsPageState = window.topBrandsPageState || {};

    // Use cached data if available and coming back from product details
    if (
      window.topBrandsPageState.cache?.products &&
      window.topBrandsPageState.isBackNavigation &&
      window.topBrandsPageState.cache.brand === brand
    ) {
      setProducts(window.topBrandsPageState.cache.products);
      setLoading(false);

      // Restore scroll position
      requestAnimationFrame(() => {
        window.scrollTo(0, window.topBrandsPageState.cache.scrollPosition || 0);
      });

      // Reset navigation flag
      window.topBrandsPageState.isBackNavigation = false;
      return;
    }

    // Fetch new data if needed
    setLoading(true);
    axiosInstance
      .get(`/product?subcategory=${encodeURIComponent(brand)}`)
      .then((res) => {
        setProducts(res.data);
        setLoading(false);

        // Cache the new data
        window.topBrandsPageState.cache = {
          products: res.data,
          brand: brand,
          scrollPosition: window.scrollY,
        };
      })
      .catch((err) => {
        setError("Failed to load products.");
        setLoading(false);
      });

    // Cleanup function
    return () => {
      if (window.topBrandsPageState) {
        window.topBrandsPageState.cache.scrollPosition = window.scrollY;
      }
    };
  }, [brand, navigate]);

  if (!brand) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="min-h-screen bg-gray-50 py-10 px-4 sm:px-8"
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              {brand} Products
            </h1>
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition"
              onClick={() => navigate(-1, { preventScrollReset: true })}
            >
              Back
            </button>
          </div>
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <SvgLoader />
            </div>
          ) : error ? (
            <div className="text-center py-20 text-red-500">{error}</div>
          ) : products.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              No products found for this brand.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
              {products.map((product) => (
                <motion.div
                  key={product._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white rounded-xl shadow hover:shadow-lg transition flex flex-col overflow-hidden border border-gray-100"
                >
                  <img
                    src={product.images?.[0]?.url || "/placeholder.svg"}
                    alt={product.name}
                    className="h-48 w-full object-contain bg-gray-100"
                  />
                  <div className="p-4 flex-1 flex flex-col">
                    <h2 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2">
                      {product.name}
                    </h2>
                    <div className="flex-1" />
                    <div className="flex items-center justify-between mt-4">
                      <span className="text-xl font-bold text-blue-600">
                        ₹{product.sellingPrice?.toLocaleString() || "-"}
                      </span>
                      <button
                        className="px-3 py-1 bg-pink-500 text-white rounded hover:bg-pink-600 text-sm"
                        onClick={() => {
                          window.topBrandsPageState =
                            window.topBrandsPageState || {};
                          window.topBrandsPageState.cache.scrollPosition =
                            window.scrollY;
                          navigate(`/products/${product._id}`, {
                            state: { fromTopBrandsPage: true },
                          });
                        }}
                      >
                        View
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default TopBrandsPage;
