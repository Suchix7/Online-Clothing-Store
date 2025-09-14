import { useState, useEffect } from "react";
import { axiosInstance } from "../lib/axiosInstance.js";
import { Link, useLocation } from "react-router-dom";

// Product card component - moved to top
const ProductCard = ({ product }) => {
  return (
    <div className="group relative bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <div className="w-full h-48 bg-gray-100 flex items-center justify-center p-4">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-contain"
        />
      </div>
      <div className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-sm font-medium text-gray-900">
              <span aria-hidden="true" className="absolute inset-0 -z-10" />
              {product.name}
            </h3>
            <div className="flex items-center mt-1">
              {[...Array(5)].map((_, i) => (
                <svg
                  key={i}
                  className={`h-4 w-4 ${
                    i < Math.floor(product.rating)
                      ? "text-yellow-400"
                      : "text-gray-300"
                  }`}
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
              <span className="text-xs text-gray-500 ml-1">
                ({product.reviews})
              </span>
            </div>
          </div>
          <p className="text-sm font-medium text-gray-900">
            ${product.price.toFixed(2)}
          </p>
        </div>
        {!product.inStock && (
          <p className="mt-1 text-xs text-red-600">Out of stock</p>
        )}
      </div>
      <div className="px-4 pb-4">
        <Link
          to={`/products/${product.id}`}
          className="w-full flex items-center justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-black hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          View Details
        </Link>
      </div>
    </div>
  );
};

// Filter component
const Filters = ({
  filters,
  handleFilterChange,
  categories,
  subcategories,
  colors,
  sizes,
}) => {
  return (
    <div className="space-y-8 bg-white p-6 rounded-lg shadow-sm">
      {/* Category filter */}
      <div>
        <h3 className="text-md font-medium text-gray-900 mb-3">Category</h3>
        <div className="space-y-2">
          {categories.map((category) => (
            <div key={category} className="flex items-center">
              <input
                id={`category-${category}`}
                name="category"
                type="radio"
                className="h-4 w-4 border-gray-300 text-gray-600 focus:ring-gray-500"
                checked={filters.category === category}
                onChange={() => handleFilterChange("category", category)}
              />
              <label
                htmlFor={`category-${category}`}
                className="ml-3 text-sm text-gray-700 capitalize"
              >
                {category.replace("-", " ")}
              </label>
            </div>
          ))}
          <div className="flex items-center">
            <input
              id="category-all"
              name="category"
              type="radio"
              className="h-4 w-4 border-gray-300 text-gray-600 focus:ring-gray-500"
              checked={!filters.category}
              onChange={() => handleFilterChange("category", "")}
            />
            <label
              htmlFor="category-all"
              className="ml-3 text-sm text-gray-700"
            >
              All Categories
            </label>
          </div>
        </div>
      </div>

      {/* Subcategory filter */}
      {filters.category && (
        <div>
          <h3 className="text-md font-medium text-gray-900 mb-3">
            Subcategory
          </h3>
          <div className="space-y-2">
            {subcategories
              .filter((subcategory) =>
                mockProducts.some(
                  (p) =>
                    p.category === filters.category &&
                    p.subcategory === subcategory
                )
              )
              .map((subcategory) => (
                <div key={subcategory} className="flex items-center">
                  <input
                    id={`subcategory-${subcategory}`}
                    name="subcategory"
                    type="radio"
                    className="h-4 w-4 border-gray-300 text-gray-600 focus:ring-gray-500"
                    checked={filters.subcategory === subcategory}
                    onChange={() =>
                      handleFilterChange("subcategory", subcategory)
                    }
                  />
                  <label
                    htmlFor={`subcategory-${subcategory}`}
                    className="ml-3 text-sm text-gray-700 capitalize"
                  >
                    {subcategory.replace("-", " ")}
                  </label>
                </div>
              ))}
            <div className="flex items-center">
              <input
                id="subcategory-all"
                name="subcategory"
                type="radio"
                className="h-4 w-4 border-gray-300 text-gray-600 focus:ring-gray-500"
                checked={!filters.subcategory}
                onChange={() => handleFilterChange("subcategory", "")}
              />
              <label
                htmlFor="subcategory-all"
                className="ml-3 text-sm text-gray-700"
              >
                All Subcategories
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Color filter */}
      <div>
        <h3 className="text-md font-medium text-gray-900 mb-3">Color</h3>
        <div className="space-y-2">
          {colors.map((color) => (
            <div key={color} className="flex items-center">
              <input
                id={`color-${color}`}
                name="color"
                type="radio"
                className="h-4 w-4 border-gray-300 text-gray-600 focus:ring-gray-500"
                checked={filters.color === color}
                onChange={() => handleFilterChange("color", color)}
              />
              <label
                htmlFor={`color-${color}`}
                className="ml-3 text-sm text-gray-700 capitalize"
              >
                {color}
              </label>
            </div>
          ))}
          <div className="flex items-center">
            <input
              id="color-all"
              name="color"
              type="radio"
              className="h-4 w-4 border-gray-300 text-gray-600 focus:ring-gray-500"
              checked={!filters.color}
              onChange={() => handleFilterChange("color", "")}
            />
            <label htmlFor="color-all" className="ml-3 text-sm text-gray-700">
              All Colors
            </label>
          </div>
        </div>
      </div>

      {/* Size filter */}
      <div>
        <h3 className="text-md font-medium text-gray-900 mb-3">Size</h3>
        <div className="grid grid-cols-2 gap-2">
          {sizes.map((size) => (
            <div key={size} className="flex items-center">
              <input
                id={`size-${size}`}
                name="size"
                type="radio"
                className="h-4 w-4 border-gray-300 text-gray-600 focus:ring-gray-500"
                checked={filters.size === size}
                onChange={() => handleFilterChange("size", size)}
              />
              <label
                htmlFor={`size-${size}`}
                className="ml-2 text-sm text-gray-700"
              >
                {size}
              </label>
            </div>
          ))}
          <div className="flex items-center">
            <input
              id="size-all"
              name="size"
              type="radio"
              className="h-4 w-4 border-gray-300 text-gray-600 focus:ring-gray-500"
              checked={!filters.size}
              onChange={() => handleFilterChange("size", "")}
            />
            <label htmlFor="size-all" className="ml-2 text-sm text-gray-700">
              All Sizes
            </label>
          </div>
        </div>
      </div>

      {/* Price range filter */}
      <div>
        <h3 className="text-md font-medium text-gray-900 mb-3">Price range</h3>
        <div className="space-y-4">
          <div className="flex justify-between text-sm text-gray-700">
            <span>${filters.priceRange[0]}</span>
            <span>${filters.priceRange[1]}</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <input
              type="number"
              min="0"
              max="200000"
              value={filters.priceRange[0]}
              onChange={(e) =>
                handleFilterChange("priceRange", [
                  parseInt(e.target.value) || 0,
                  filters.priceRange[1],
                ])
              }
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500 sm:text-sm"
            />
            <input
              type="number"
              min="0"
              max="200000"
              value={filters.priceRange[1]}
              onChange={(e) =>
                handleFilterChange("priceRange", [
                  filters.priceRange[0],
                  parseInt(e.target.value) || 0,
                ])
              }
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500 sm:text-sm"
            />
          </div>
          <input
            type="range"
            min="0"
            max="200000"
            step="50"
            value={filters.priceRange[1]}
            onChange={(e) =>
              handleFilterChange("priceRange", [
                filters.priceRange[0],
                parseInt(e.target.value),
              ])
            }
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
        </div>
      </div>

      {/* In stock filter */}
      <div className="flex items-center pt-2">
        <input
          id="in-stock"
          name="in-stock"
          type="checkbox"
          className="h-4 w-4 border-gray-300 text-black focus:ring-gray-500"
          checked={filters.inStock}
          onChange={(e) => handleFilterChange("inStock", e.target.checked)}
        />
        <label htmlFor="in-stock" className="ml-3 text-sm text-gray-700">
          In stock only
        </label>
      </div>
    </div>
  );
};

const Products = () => {
  const location = useLocation();
  const [products, setProducts] = useState([]);
  const [mockProducts, setMockProducts] = useState([]);
  const [filters, setFilters] = useState({
    category: location.state?.selectedCategory || "",
    subcategory: "",
    color: "",
    size: "",
    priceRange: [0, 200000],
    inStock: false,
    sortBy: "default",
  });

  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState(null);

  // Fetch products on component mount
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axiosInstance.get("/product");
        console.log(response.data);
        const formattedProducts = response.data.map((product) => ({
          id: product._id,
          name: product.name,
          price: product.sellingPrice,
          category: product.parentCategory,
          subcategory: product.parentSubcategory,
          color: product.color,
          size: product.size,
          rating: 5,
          reviews: 4,
          image: product.images[0]?.url,
          inStock: true,
          specs: {
            power: "15W",
            compatibility: "Qi",
            cableLength: "1.5m",
            ledIndicator: "Yes",
          },
        }));
        setMockProducts(formattedProducts);
        setProducts(formattedProducts); // Initialize with all products
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };

    fetchProducts();
  }, []);

  // Apply filters whenever filters or mockProducts change
  useEffect(() => {
    if (mockProducts.length === 0) return;

    let filteredProducts = [...mockProducts];

    if (filters.category) {
      filteredProducts = filteredProducts.filter(
        (product) => product.category === filters.category
      );
    }

    if (filters.subcategory) {
      filteredProducts = filteredProducts.filter(
        (product) => product.subcategory === filters.subcategory
      );
    }

    if (filters.color) {
      filteredProducts = filteredProducts.filter(
        (product) => product.color === filters.color
      );
    }

    if (filters.size) {
      filteredProducts = filteredProducts.filter((product) =>
        product.size.includes(filters.size)
      );
    }

    if (filters.inStock) {
      filteredProducts = filteredProducts.filter((product) => product.inStock);
    }

    filteredProducts = filteredProducts.filter(
      (product) =>
        product.price >= filters.priceRange[0] &&
        product.price <= filters.priceRange[1]
    );

    switch (filters.sortBy) {
      case "price-low":
        filteredProducts.sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        filteredProducts.sort((a, b) => b.price - a.price);
        break;
      case "rating":
        filteredProducts.sort((a, b) => b.rating - a.rating);
        break;
      default:
        filteredProducts.sort((a, b) => b.id - a.id);
    }

    setProducts(filteredProducts);
  }, [filters, mockProducts]);

  // ... (rest of your component code remains the same)
  const handleFilterChange = (filterName, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterName]: value,
    }));
  };

  const clearFilters = () => {
    setFilters({
      category: "",
      subcategory: "",
      color: "",
      size: "",
      priceRange: [2000, 5000],
      inStock: false,
      sortBy: "default",
    });
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-b border-gray-200 py-8">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">
            Tech Haven
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            The latest gadgets and electronics
          </p>
        </div>

        <div className="pt-12 pb-24 lg:grid lg:grid-cols-4 lg:gap-x-8">
          {/* Mobile filter dialog */}
          <div className="lg:hidden mb-6">
            <button
              type="button"
              className="flex items-center justify-center w-full py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              onClick={() => setMobileFiltersOpen(true)}
            >
              <span className="mr-2">Filters</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </button>

            {mobileFiltersOpen && (
              <div className="fixed inset-0 z-50 overflow-y-auto bg-white p-4">
                <div className="flex justify-between items-center border-b pb-4 mb-4">
                  <h2 className="text-lg font-medium text-gray-900">Filters</h2>
                  <button
                    onClick={() => setMobileFiltersOpen(false)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
                <div className="mt-4">
                  <Filters
                    filters={filters}
                    handleFilterChange={handleFilterChange}
                    categories={categories}
                    subcategories={subcategories}
                    colors={colors}
                    sizes={sizes}
                  />
                </div>
                <div className="mt-6 flex space-x-4">
                  <button
                    onClick={clearFilters}
                    className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Clear all
                  </button>
                  <button
                    onClick={() => setMobileFiltersOpen(false)}
                    className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-black hover:bg-gray-700"
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Desktop filters */}
          <div className="hidden lg:block">
            <div className="sticky top-20">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-gray-900">Filters</h2>
                <button
                  onClick={clearFilters}
                  className="text-sm font-medium text-gray-600 hover:text-gray-500"
                >
                  Clear all
                </button>
              </div>
              <Filters
                filters={filters}
                handleFilterChange={handleFilterChange}
                categories={categories}
                subcategories={subcategories}
                colors={colors}
                sizes={sizes}
              />
            </div>
          </div>

          {/* Product grid */}
          <div className="lg:col-span-3">
            {/* Sorting and results count */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 bg-white p-4 rounded-lg shadow-sm">
              <p className="text-sm text-gray-700 mb-2 sm:mb-0">
                <span className="font-medium">{products.length}</span> products
                found
              </p>
              <div className="flex items-center">
                <label
                  htmlFor="sort"
                  className="mr-2 text-sm font-medium text-gray-700"
                >
                  Sort by:
                </label>
                <select
                  id="sort"
                  className="border border-gray-300 text-gray-700 rounded-md py-2 pl-3 pr-10 bg-white focus:border-gray-500 focus:outline-none focus:ring-gray-500"
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange("sortBy", e.target.value)}
                >
                  <option value="default">Featured</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating">Customer Rating</option>
                </select>
              </div>
            </div>

            {/* Product cards */}
            {products.length > 0 ? (
              <div className="grid grid-cols-1 gap-y-6 gap-x-6 sm:grid-cols-2 lg:grid-cols-3 xl:gap-x-8">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-lg shadow-sm">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <h3 className="mt-2 text-lg font-medium text-gray-900">
                  No products found
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Try adjusting your filters to find what you're looking for.
                </p>
                <div className="mt-6">
                  <button
                    onClick={clearFilters}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-black hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  >
                    Clear all filters
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick View Modal */}
      {quickViewProduct && (
        <div className="fixed z-50 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity"
              aria-hidden="true"
            >
              <div
                className="absolute inset-0 bg-gray-500 opacity-75"
                onClick={() => setQuickViewProduct(null)}
              ></div>
            </div>
            <span
              className="hidden sm:inline-block sm:align-middle sm:h-screen"
              aria-hidden="true"
            >
              &#8203;
            </span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <div className="flex justify-between items-start">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        {quickViewProduct.name}
                      </h3>
                      <button
                        type="button"
                        className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                        onClick={() => setQuickViewProduct(null)}
                      >
                        <span className="sr-only">Close</span>
                        <svg
                          className="h-6 w-6"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-gray-100 rounded-lg p-4 flex items-center justify-center">
                        <img
                          src={quickViewProduct.image}
                          alt={quickViewProduct.name}
                          className="w-full h-64 object-contain"
                        />
                      </div>
                      <div>
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <svg
                              key={i}
                              className={`h-5 w-5 ${
                                i < Math.floor(quickViewProduct.rating)
                                  ? "text-yellow-400"
                                  : "text-gray-300"
                              }`}
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                          <span className="text-sm text-gray-500 ml-1">
                            ({quickViewProduct.reviews} reviews)
                          </span>
                        </div>
                        <p className="mt-2 text-2xl font-bold text-gray-900">
                          ${quickViewProduct.price.toFixed(2)}
                        </p>
                        {!quickViewProduct.inStock && (
                          <p className="mt-1 text-sm text-red-600">
                            Currently out of stock
                          </p>
                        )}

                        <div className="mt-6">
                          <h4 className="text-sm font-medium text-gray-900">
                            Details
                          </h4>
                          <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-gray-700">
                            {Object.entries(quickViewProduct.specs).map(
                              ([key, value]) => (
                                <div key={key} className="flex">
                                  <span className="font-medium capitalize">
                                    {key}:
                                  </span>
                                  <span className="ml-1">{value}</span>
                                </div>
                              )
                            )}
                          </div>
                        </div>

                        <div className="mt-6">
                          <h4 className="text-sm font-medium text-gray-900">
                            Available options
                          </h4>
                          <div className="mt-2 space-y-3">
                            {quickViewProduct.size.map((size) => (
                              <div key={size} className="flex items-center">
                                <input
                                  id={`size-${size}`}
                                  name="size"
                                  type="radio"
                                  className="h-4 w-4 border-gray-300 text-gray-600 focus:ring-gray-500"
                                />
                                <label
                                  htmlFor={`size-${size}`}
                                  className="ml-3 text-sm text-gray-700"
                                >
                                  {size}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-black text-base font-medium text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                  disabled={!quickViewProduct.inStock}
                >
                  Add to cart
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setQuickViewProduct(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
