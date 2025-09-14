import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { axiosInstance } from "../lib/axiosInstance.js";
import { Link } from "react-router-dom";
import SvgLoader from "./SvgLoader";
import { Truck, Star } from "lucide-react";
import MasonryGrid from "./MasonryGrid.jsx";

// Global state for caching products and state
const productsPageState = {
  cache: {
    products: null,
    filteredProducts: null,
    filters: null,
    categories: null,
    subcategories: null,
    colors: null,
    scrollPosition: 0,
    searchQuery: null,
  },
  isBackNavigation: false,
  isProductClick: false,
};
const compact = (s = "") => s.toLowerCase().replace(/[^a-z0-9]/g, "");

// quick check: tokens like "iphone11", "s24ultra", "12pro" look model-ish
const isModelishToken = (t = "") => /[a-z]\d|\d[a-z]/i.test(t);

// escape regex special chars (for safe exact-word tests)
const escapeRe = (s = "") => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// split to words but keep only a–z0–9 chunks (helps consecutive matching)
const splitWords = (s = "") =>
  s
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
// Session storage keys
const STORAGE_KEYS = {
  PRODUCTS: "products_data",
  FILTERS: "products_filters",
  FILTERED_PRODUCTS: "filtered_products",
  CATEGORIES: "products_categories",
  SUBCATEGORIES: "products_subcategories",
  COLORS: "products_colors",
  SCROLL_POSITION: "products_scroll",
};

// Add these constants and functions at the top of the file, after the imports
const commonWords = new Set([
  "the",
  "a",
  "an",
  "and",
  "or",
  "but",
  "in",
  "on",
  "at",
  "to",
  "for",
  "with",
  "by",
]);

// Levenshtein distance for fuzzy matching
const levenshteinDistance = (str1, str2) => {
  const track = Array(str2.length + 1)
    .fill(null)
    .map(() => Array(str1.length + 1).fill(null));
  for (let i = 0; i <= str1.length; i += 1) {
    track[0][i] = i;
  }
  for (let j = 0; j <= str2.length; j += 1) {
    track[j][0] = j;
  }
  for (let j = 1; j <= str2.length; j += 1) {
    for (let i = 1; i <= str1.length; i += 1) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      track[j][i] = Math.min(
        track[j][i - 1] + 1,
        track[j - 1][i] + 1,
        track[j - 1][i - 1] + indicator
      );
    }
  }
  return track[str2.length][str1.length];
};

// Add these constants at the top of the file after imports
const PRODUCT_TYPE_HIERARCHY = {
  phone: 10,
  smartphone: 10,
  mobile: 10,
  laptop: 10,
  computer: 10,
  tablet: 10,
  watch: 10,
  accessory: 3,
  case: 2,
  cover: 2,
  charger: 2,
  cable: 2,
  "screen protector": 2,
  earphone: 5,
  headphone: 5,
  airpod: 5,
};

const ACCESSORY_TERMS = {
  charger: true,
  cable: true,
  case: true,
  cover: true,
  protector: true,
  accessory: true,
  accessories: true,
  "screen guard": true,
  "power bank": true,
  adapter: true,
  dock: true,
  stand: true,
  mount: true,
  holder: true,
};

// Helper function to determine if a search is for accessories
const isAccessorySearch = (searchTerms) => {
  return searchTerms.some((term) => ACCESSORY_TERMS[term]);
};

// Helper function to determine if a product is an accessory
const getProductTypeScore = (
  productName,
  category,
  subcategory,
  searchTerms
) => {
  const textToCheck = `${productName} ${category} ${subcategory}`.toLowerCase();
  const searchingForAccessory = isAccessorySearch(searchTerms);

  // Check if it's an accessory
  const isAccessory = Object.keys(ACCESSORY_TERMS).some((term) =>
    textToCheck.includes(term)
  );

  // If searching for an accessory and this is an accessory, boost the score
  if (searchingForAccessory && isAccessory) {
    return 20; // Double the normal product score for matching accessory searches
  }

  // If searching for an accessory but this is not an accessory, penalize
  if (searchingForAccessory && !isAccessory) {
    return 2; // Significant penalty for non-accessories when searching for accessories
  }

  // Regular product type scoring
  for (const [type, score] of Object.entries(PRODUCT_TYPE_HIERARCHY)) {
    if (textToCheck.includes(type)) {
      return score;
    }
  }
  return 5; // default score for unknown product types
};

// Calculate search score for a product
const calculateSearchScore = (product, searchTerms) => {
  if (!searchTerms.length) return 0;

  let totalScore = 0;
  const productText = {
    name: product.name.toLowerCase(),
    description: product.description?.toLowerCase() || "",
    category: product.category?.toLowerCase() || "",
    subcategory: product.subcategory?.toLowerCase() || "",
    colors: product.color?.map((c) => c.colorName.toLowerCase()) || [],
  };
  const productTextCompact = {
    name: compact(productText.name),
    description: compact(productText.description),
    category: compact(productText.category),
    subcategory: compact(productText.subcategory),
  };

  // Field weights with increased importance for name matches
  const weights = {
    name: 25, // Increased from 10 to 25 for stronger name matching
    description: 3,
    category: 4,
    subcategory: 3,
    colors: 2,
  };

  const fullSearchQuery = searchTerms.join(" ");
  const fullQueryLength = searchTerms.length;
  const fullQueryCompact = compact(fullSearchQuery);

  // Get product type score with search context
  let productTypeScore = getProductTypeScore(
    productText.name,
    productText.category,
    productText.subcategory,
    searchTerms
  );
  if (fullQueryCompact && productTextCompact.name.includes(fullQueryCompact)) {
    totalScore += 120 * productTypeScore; // modest boost for compacted full match
  }
  // Check for exact product name match first
  if (productText.name === fullSearchQuery) {
    return 1000 * productTypeScore; // Scale exact match score by product type
  }

  // Check if this is a specific model search (e.g., "iphone 16")
  const isSpecificModelSearch = searchTerms.some((term) => /\d+/.test(term));
  const searchingForAccessory = isAccessorySearch(searchTerms);

  // Adjust scoring based on search intent
  if (isSpecificModelSearch && !searchingForAccessory) {
    const isAccessory = [
      "case",
      "cover",
      "charger",
      "cable",
      "protector",
      "accessory",
    ].some(
      (term) =>
        productText.name.includes(term) ||
        productText.category.includes(term) ||
        productText.subcategory.includes(term)
    );

    // Apply heavy penalty to accessories when searching for a specific model
    if (isAccessory) {
      productTypeScore *= 0.2; // 80% penalty for accessories
    }
  }

  // Calculate word proximity in product name
  const nameWords = splitWords(productText.name);

  let maxConsecutiveMatches = 0;
  let currentConsecutiveMatches = 0;
  let foundTermsInOrder = 0;
  let lastFoundIndex = -1;
  let allTermsInName = true;
  for (const term of searchTerms) {
    const ok =
      productText.name.includes(term) ||
      (isModelishToken(term) &&
        productTextCompact.name.includes(compact(term)));
    if (!ok) {
      allTermsInName = false;
      break;
    }
  }

  // Check for consecutive matches
  for (let i = 0; i < nameWords.length; i++) {
    if (searchTerms.includes(nameWords[i])) {
      const termIndex = searchTerms.indexOf(nameWords[i]);
      if (lastFoundIndex === -1 || termIndex === lastFoundIndex + 1) {
        currentConsecutiveMatches++;
        foundTermsInOrder++;
      } else {
        currentConsecutiveMatches = 1;
      }
      lastFoundIndex = termIndex;
      maxConsecutiveMatches = Math.max(
        maxConsecutiveMatches,
        currentConsecutiveMatches
      );
    } else {
      currentConsecutiveMatches = 0;
    }
  }

  // Significant boost for terms appearing in order
  if (maxConsecutiveMatches === fullQueryLength && allTermsInName) {
    totalScore += 200 * productTypeScore; // Increased boost for consecutive matches
  } else if (foundTermsInOrder === fullQueryLength) {
    totalScore += 100 * productTypeScore; // Boost for all terms in order
  }

  // Individual term scoring
  for (const term of searchTerms) {
    let termScore = 0;
    let hasMatch = false;
    let isExactMatch = false;

    // Check each field
    for (const [field, text] of Object.entries(productText)) {
      const fieldWeight = weights[field];

      if (field === "colors") {
        for (const color of text) {
          if (color === term) {
            termScore += fieldWeight * 2;
            hasMatch = true;
          }
        }
        continue;
      }

      // Exact word match with boundaries
      const safeWordRe = new RegExp(`\\b${escapeRe(term)}\\b`);
      const textComp = productTextCompact[field] ?? compact(text);

      // 1) exact whole-word in the raw text
      if (safeWordRe.test(text)) {
        termScore += fieldWeight * 3;
        hasMatch = true;
        isExactMatch = true;

        // 2) space-insensitive match for model-ish tokens (e.g., "iphone11" vs "iPhone 11")
      } else if (isModelishToken(term) && textComp.includes(compact(term))) {
        termScore += fieldWeight * 2.5;
        hasMatch = true;

        // 3) fallback: partial + Levenshtein
      } else if (text.includes(term)) {
        const words = text.split(/\s+/);
        for (const word of words) {
          if (word.includes(term)) {
            const distance = levenshteinDistance(word, term);
            if (distance <= 2) {
              termScore += fieldWeight * (1 - distance * 0.3);
              hasMatch = true;
            }
          }
        }
      }
    }

    // Apply term position boost
    if (isExactMatch && productText.name.startsWith(term)) {
      termScore *= 1.5; // exact word at start
    } else if (
      isModelishToken(term) &&
      productTextCompact.name.startsWith(compact(term))
    ) {
      termScore *= 1.35; // compacted model token at start
    }

    // Only add score if we found a legitimate match
    if (hasMatch) {
      totalScore += termScore * productTypeScore;
    }
  }

  // Penalties and adjustments
  if (!allTermsInName) {
    totalScore *= 0.3; // Stronger penalty if not all terms are in the name
  }

  // Higher minimum threshold for specific model searches
  const minThreshold = isSpecificModelSearch ? 10 : 5;
  if (totalScore < minThreshold) {
    return 0;
  }

  return totalScore;
};

const Products = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const searchQuery = searchParams.get("search") || "";
  const [isInitialized, setIsInitialized] = useState(false);
  const hasRestoredScroll = useRef(false);
  const previousSearchQuery = useRef(searchQuery);
  // Initialize state from cache if available
  const [products, setProducts] = useState(
    productsPageState.cache.products || []
  );
  const [filters, setFilters] = useState(
    productsPageState.cache.filters || {
      category: location.state?.selectedCategory || "",
      subcategory: "",
      color: "",
      priceRange: [0, 200000],
      inStock: false,
      sortBy: "default",
    }
  );
  useEffect(() => {
    if (!searchQuery) {
      sessionStorage.removeItem("matchedModel");
    }
  }, [searchQuery]);

  const matchedModel = sessionStorage.getItem("matchedModel");
  const [categories, setCategories] = useState(
    productsPageState.cache.categories || []
  );
  const [subcategories, setSubcategories] = useState(
    productsPageState.cache.subcategories || []
  );
  const [colors, setColors] = useState(productsPageState.cache.colors || []);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [loading, setLoading] = useState(!productsPageState.cache.products);
  const [error, setError] = useState(null);

  // Memoize filtered products calculation
  const filteredProducts = useMemo(() => {
    if (!isInitialized || !products.length) return [];

    let results = [...products];

    // Apply search filter
    if (searchQuery) {
      const searchTerms = searchQuery
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean)
        .filter((term) => !commonWords.has(term));

      // Check if this is a specific model search
      const isSpecificModelSearch = searchTerms.some((term) =>
        /\d+/.test(term)
      );

      // Score and filter products
      results = results
        .map((product) => {
          const score = calculateSearchScore(product, searchTerms);
          return { ...product, searchScore: score };
        })
        .filter((product) => product.searchScore > 0)
        .sort((a, b) => b.searchScore - a.searchScore);

      // If searching for a specific model, apply stricter filtering
      if (isSpecificModelSearch) {
        const maxScore = Math.max(...results.map((p) => p.searchScore));
        const threshold = maxScore * 0.3; // Show only results within 70% of the max score
        results = results.filter((p) => p.searchScore >= threshold);
      }
    }

    // Apply category filter (even if there's a search query)
    if (filters.category) {
      results = results.filter((p) => p.category === filters.category);
    }

    if (filters.subcategory) {
      results = results.filter((p) => p.subcategory === filters.subcategory);
    }

    if (filters.color) {
      results = results.filter((p) =>
        p.color?.some((c) => c.colorName === filters.color)
      );
    }

    if (filters.inStock) {
      results = results.filter((p) => p.inStock);
    }

    results = results.filter(
      (p) =>
        p.price >= filters.priceRange[0] && p.price <= filters.priceRange[1]
    );

    // Apply sorting
    switch (filters.sortBy) {
      case "price-low":
        results.sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        results.sort((a, b) => b.price - a.price);
        break;
      case "rating":
        results.sort((a, b) => b.rating - a.rating);
        break;
      default:
        if (!searchQuery) {
          results.sort((a, b) => b.id - a.id);
        }
    }

    return results;
  }, [products, filters, searchQuery, isInitialized]);

  // Update cache when filtered products change
  useEffect(() => {
    productsPageState.cache.filteredProducts = filteredProducts;
    productsPageState.cache.filters = filters;
  }, [filteredProducts, filters]);

  // Effect to handle initial data load
  useEffect(() => {
    let isMounted = true;

    const fetchProducts = async () => {
      // Check if we have cached data and are returning from product details
      if (
        productsPageState.cache.products &&
        (productsPageState.isBackNavigation || productsPageState.isProductClick)
      ) {
        if (isMounted) {
          setProducts(productsPageState.cache.products);
          setFilters(productsPageState.cache.filters);
          setCategories(productsPageState.cache.categories);
          setSubcategories(productsPageState.cache.subcategories);
          setColors(productsPageState.cache.colors);
          setLoading(false);
          setIsInitialized(true);

          // Restore scroll position
          requestAnimationFrame(() => {
            window.scrollTo(0, productsPageState.cache.scrollPosition || 0);
          });
        }
        return;
      }

      // Only fetch if we don't have cached data or if it's a fresh visit
      if (
        !productsPageState.cache.products ||
        (!productsPageState.isBackNavigation &&
          !productsPageState.isProductClick)
      ) {
        try {
          setLoading(true);
          const response = await axiosInstance.get("/product");

          if (!isMounted) return;

          const formattedProducts = response.data.map((product) => ({
            id: product._id,
            modelName: product.modelName.replace(/\s+/g, "-"),
            name: product.name,
            price: product.sellingPrice,
            category: product.parentCategory,
            subcategory: product.parentSubcategory,
            color: product.color,
            size: product.size,
            model: product.model,
            rating: product.rating || 0,
            reviews: product.reviews || 0,
            image: product.images[0]?.url,
            inStock: product.stock > 0,
            stock: product.stock || 0,
            description: product.description,
            freeShipping: product.freeShipping || true,
          }));

          if (isMounted) {
            setProducts(formattedProducts);
            const uniqueCategories = [
              ...new Set(formattedProducts.map((p) => p.category)),
            ];
            const uniqueSubcategories = [
              ...new Set(formattedProducts.map((p) => p.subcategory)),
            ];
            const uniqueColors = [
              ...new Set(
                formattedProducts.flatMap(
                  (p) => p.color?.map((c) => c.colorName?.trim()) || []
                )
              ),
            ].filter(Boolean);

            setCategories(uniqueCategories);
            setSubcategories(uniqueSubcategories);
            setColors(uniqueColors);
            setIsInitialized(true);

            // Cache the data
            productsPageState.cache.products = formattedProducts;
            productsPageState.cache.categories = uniqueCategories;
            productsPageState.cache.subcategories = uniqueSubcategories;
            productsPageState.cache.colors = uniqueColors;
            productsPageState.cache.searchQuery = searchQuery;
          }
        } catch (error) {
          if (isMounted) {
            console.error("Error fetching products:", error);
            setError("Failed to load products");
          }
        } finally {
          if (isMounted) {
            setLoading(false);
          }
        }
      }
    };

    fetchProducts();

    return () => {
      isMounted = false;
    };
  }, [searchQuery]);

  // Effect to handle cleanup
  useEffect(() => {
    return () => {
      // Only clear cache if not navigating to product details
      if (!productsPageState.isProductClick) {
        productsPageState.cache = {
          products: null,
          filteredProducts: null,
          filters: null,
          categories: null,
          subcategories: null,
          colors: null,
          scrollPosition: 0,
          searchQuery: null,
        };
      }
    };
  }, []);

  // Effect to handle category changes from navigation
  useEffect(() => {
    if (location.state?.selectedCategory && isInitialized) {
      // Ensure we're at the top of the page
      window.scrollTo(0, 0);

      setFilters((prev) => ({
        ...prev,
        category: location.state.selectedCategory,
      }));
    }
  }, [location.state?.selectedCategory, isInitialized]);

  // Effect to handle search query changes
  useEffect(() => {
    if (searchQuery) {
      // Reset filters to show all categories when searching
      setFilters((prev) => ({
        ...prev,
        category: "",
        subcategory: "",
        color: "",
        sortBy: "default",
        inStock: false,
        priceRange: [0, 200000],
      }));
      window.scrollTo(0, 0);
    }
  }, [searchQuery]);

  // Add effect to handle search query changes
  useEffect(() => {
    // Only scroll if this is not the initial load and the search query actually changed
    if (isInitialized && previousSearchQuery.current !== searchQuery) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    previousSearchQuery.current = searchQuery;
  }, [searchQuery, isInitialized]);

  // Add effect to handle filter changes
  useEffect(() => {
    if (isInitialized && !productsPageState.isBackNavigation) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [filters, isInitialized]);

  const handleFilterChange = useCallback((filterName, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterName]: value,
    }));
  }, []);

  const clearFilters = useCallback(() => {
    const newFilters = {
      category: location.state?.selectedCategory || "",
      subcategory: "",
      color: "",
      priceRange: [0, 200000],
      inStock: false,
      sortBy: "default",
    };
    setFilters(newFilters);

    if (!location.state?.selectedCategory) {
      navigate("/products", { replace: true });
    }

    // Scroll to top when clearing filters
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [location.state?.selectedCategory, navigate]);

  const getColorClass = (colorName) => {
    const colorMap = {
      black: "bg-black",
      white: "bg-white border border-gray-200",
      red: "bg-red-500",
      blue: "bg-blue-500",
      green: "bg-green-500",
      yellow: "bg-yellow-400",
      purple: "bg-purple-500",
      pink: "bg-pink-500",
      gray: "bg-gray-500",
      brown: "bg-amber-800",
      orange: "bg-orange-500",
      silver: "bg-gray-300",
      gold: "bg-yellow-600",
      navy: "bg-blue-900",
      beige: "bg-yellow-100",
      maroon: "bg-red-900",
      cyan: "bg-cyan-500",
      teal: "bg-teal-500",
      indigo: "bg-indigo-500",
      violet: "bg-violet-500",
    };

    // Convert color name to lowercase for matching
    const normalizedColor = colorName.toLowerCase();
    return colorMap[normalizedColor] || "bg-gray-200"; // default color if no match
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50">
        <SvgLoader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{error}</h2>
          <button
            onClick={() => window.location.reload()}
            className="text-blue-600 hover:text-blue-800"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="mx-auto px-2 sm:px-6 lg:px-8 max-w-7xl">
        {/* Header */}
        <div className="border-b border-gray-200 py-2 sm:py-6">
          <h1 className="text-lg sm:text-4xl font-bold tracking-tight text-gray-900">
            Tech Haven
          </h1>
          <p className="mt-0.5 text-xs sm:text-lg text-gray-600">
            The latest gadgets and electronics
          </p>
        </div>

        {/* Search Results Header */}
        {searchQuery && (
          <div className="pt-2 sm:pt-6 pb-1 sm:pb-2">
            <h2 className="text-sm sm:text-xl font-semibold">
              Search results for:{" "}
              <span className="text-gray-600">"{searchQuery}"</span>
            </h2>
            <button
              onClick={() => navigate("/products")}
              className="mt-1 text-xs sm:text-sm text-gray-500 hover:text-gray-700"
            >
              Clear search
            </button>
          </div>
        )}

        <div className="pt-3 sm:pt-8 pb-16 sm:pb-24 lg:grid lg:grid-cols-4 lg:gap-x-8">
          {/* Mobile Filters Button */}
          <div className="lg:hidden mb-3">
            <button
              type="button"
              className="w-full flex items-center justify-center py-1.5 px-3 border border-gray-300 rounded-md shadow-sm text-xs sm:text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              onClick={() => setMobileFiltersOpen(true)}
            >
              <span className="mr-1">Filters</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3.5 w-3.5"
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
              <div className="fixed inset-0 z-50 overflow-y-auto bg-white">
                <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 z-100 flex justify-between items-center">
                  <h2 className="text-lg font-medium text-gray-900">Filters</h2>
                  <button
                    onClick={() => setMobileFiltersOpen(false)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <svg
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

                <div className="px-4 py-2 divide-y divide-gray-200">
                  {/* Category Filter */}
                  <div className="py-4">
                    <h3 className="text-base font-medium text-gray-900">
                      Category
                    </h3>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {categories.map((category) => (
                        <label
                          key={category}
                          className={`relative flex items-center px-2 py-1.5 rounded-lg cursor-pointer text-sm ${
                            filters.category === category
                              ? "bg-gray-100 ring-2 ring-black"
                              : "hover:bg-gray-50 border border-gray-200"
                          }`}
                        >
                          <input
                            type="radio"
                            name="mobile-category"
                            value={category}
                            checked={filters.category === category}
                            onChange={() =>
                              handleFilterChange("category", category)
                            }
                            className="h-3 w-3 text-black border-gray-300 focus:ring-black"
                          />
                          <span className="ml-2 text-sm text-gray-900 capitalize truncate">
                            {category?.replace("-", " ") || ""}
                          </span>
                        </label>
                      ))}
                      <label
                        className={`relative flex items-center px-2 py-1.5 rounded-lg cursor-pointer text-sm ${
                          !filters.category
                            ? "bg-gray-100 ring-2 ring-black"
                            : "hover:bg-gray-50 border border-gray-200"
                        }`}
                      >
                        <input
                          type="radio"
                          name="mobile-category"
                          value=""
                          checked={!filters.category}
                          onChange={() => handleFilterChange("category", "")}
                          className="h-3 w-3 text-black border-gray-300 focus:ring-black"
                        />
                        <span className="ml-2 text-sm text-gray-900">All</span>
                      </label>
                    </div>
                  </div>

                  {/* Subcategory Filter */}
                  <div className="py-4">
                    <h3 className="text-base font-medium text-gray-900">
                      Subcategory
                    </h3>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {subcategories.map((subcategory) => (
                        <label
                          key={subcategory}
                          className={`relative flex items-center px-2 py-1.5 rounded-lg cursor-pointer text-sm ${
                            filters.subcategory === subcategory
                              ? "bg-gray-100 ring-2 ring-black"
                              : "hover:bg-gray-50 border border-gray-200"
                          }`}
                        >
                          <input
                            type="radio"
                            name="mobile-subcategory"
                            value={subcategory}
                            checked={filters.subcategory === subcategory}
                            onChange={() =>
                              handleFilterChange("subcategory", subcategory)
                            }
                            className="h-3 w-3 text-black border-gray-300 focus:ring-black"
                          />
                          <span className="ml-2 text-sm text-gray-900 capitalize truncate">
                            {subcategory?.replace("-", " ") || ""}
                          </span>
                        </label>
                      ))}
                      <label
                        className={`relative flex items-center px-2 py-1.5 rounded-lg cursor-pointer text-sm ${
                          !filters.subcategory
                            ? "bg-gray-100 ring-2 ring-black"
                            : "hover:bg-gray-50 border border-gray-200"
                        }`}
                      >
                        <input
                          type="radio"
                          name="mobile-subcategory"
                          value=""
                          checked={!filters.subcategory}
                          onChange={() => handleFilterChange("subcategory", "")}
                          className="h-3 w-3 text-black border-gray-300 focus:ring-black"
                        />
                        <span className="ml-2 text-sm text-gray-900">All</span>
                      </label>
                    </div>
                  </div>

                  {/* Color Filter */}
                  <div className="py-4">
                    <h3 className="text-base font-medium text-gray-900">
                      Color
                    </h3>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {colors.map((color) => (
                        <label
                          key={color}
                          className={`relative flex items-center px-2 py-1.5 rounded-lg cursor-pointer text-sm ${
                            filters.color === color
                              ? "bg-gray-100 ring-2 ring-black"
                              : "hover:bg-gray-50 border border-gray-200"
                          }`}
                        >
                          <input
                            type="radio"
                            name="mobile-color"
                            value={color}
                            checked={filters.color === color}
                            onChange={() => handleFilterChange("color", color)}
                            className="h-3 w-3 text-black border-gray-300 focus:ring-black"
                          />
                          <span className="ml-2 text-sm text-gray-900 capitalize flex items-center gap-1.5">
                            <span
                              className={`inline-block w-3 h-3 rounded-full ${getColorClass(
                                color
                              )}`}
                            />
                            <span className="truncate">{color}</span>
                          </span>
                        </label>
                      ))}
                      <label
                        className={`relative flex items-center px-2 py-1.5 rounded-lg cursor-pointer text-sm ${
                          !filters.color
                            ? "bg-gray-100 ring-2 ring-black"
                            : "hover:bg-gray-50 border border-gray-200"
                        }`}
                      >
                        <input
                          type="radio"
                          name="mobile-color"
                          value=""
                          checked={!filters.color}
                          onChange={() => handleFilterChange("color", "")}
                          className="h-3 w-3 text-black border-gray-300 focus:ring-black"
                        />
                        <span className="ml-2 text-sm text-gray-900">All</span>
                      </label>
                    </div>
                  </div>

                  {/* Price Filter */}
                  <div className="py-4">
                    <h3 className="text-base font-medium text-gray-900">
                      Price range
                    </h3>
                    <div className="mt-3 space-y-3">
                      <div className="flex justify-between text-sm text-gray-900">
                        <span>${filters.priceRange[0]}</span>
                        <span>${filters.priceRange[1]}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="200000"
                        step="1000"
                        value={filters.priceRange[1]}
                        onChange={(e) =>
                          handleFilterChange("priceRange", [
                            filters.priceRange[0],
                            parseInt(e.target.value),
                          ])
                        }
                        className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="grid grid-cols-2 gap-3">
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
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-black focus:border-black text-sm py-1"
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
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-black focus:border-black text-sm py-1"
                        />
                      </div>
                    </div>
                  </div>

                  {/* In Stock Filter */}
                  <div className="py-4">
                    <label
                      className={`relative flex items-center px-2 py-1.5 rounded-lg cursor-pointer text-sm ${
                        filters.inStock
                          ? "bg-gray-100 ring-2 ring-black"
                          : "hover:bg-gray-50 border border-gray-200"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={filters.inStock}
                        onChange={(e) =>
                          handleFilterChange("inStock", e.target.checked)
                        }
                        className="h-3 w-3 text-black border-gray-300 rounded focus:ring-black"
                      />
                      <span className="ml-2 text-sm text-gray-900">
                        In stock only
                      </span>
                    </label>
                  </div>
                </div>

                <div className="sticky bottom-0 bg-white border-t border-gray-200 p-3 flex space-x-3">
                  <button
                    onClick={clearFilters}
                    className="flex-1 py-2.5 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
                  >
                    Clear all
                  </button>
                  <button
                    onClick={() => setMobileFiltersOpen(false)}
                    className="flex-1 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Desktop Filters */}
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
              />
            </div>
          </div>

          {/* Product Grid */}
          <div className="lg:col-span-3">
            {/* Sorting */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 bg-white p-2 sm:p-4 rounded-lg shadow-sm">
              <p className="text-[10px] sm:text-sm text-gray-700 mb-2 sm:mb-0">
                <span className="font-medium">{filteredProducts.length}</span>{" "}
                products found
              </p>
              <div className="flex items-center">
                <label
                  htmlFor="sort"
                  className="mr-2 text-[10px] sm:text-sm font-medium text-gray-700"
                >
                  Sort by:
                </label>
                <select
                  id="sort"
                  className="text-[10px] sm:text-sm border border-gray-300 text-gray-700 rounded-md py-1 pl-2 pr-6 bg-white focus:border-gray-500 focus:outline-none focus:ring-gray-500"
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

            {/* Products Grid */}
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <SvgLoader />
              </div>
            ) : filteredProducts.length > 0 ? (
              <div
                className={`grid ${
                  searchQuery
                    ? "grid-cols-1 gap-y-4"
                    : "grid-cols-2 gap-x-2 gap-y-3 sm:gap-x-4 sm:gap-y-6 md:gap-x-6 lg:grid-cols-3 lg:gap-8"
                }`}
              >
                {filteredProducts.map((product) => (
                  <Link
                    key={product.id}
                    to={`/products/${product.modelName}`}
                    state={{ fromProductsPage: true }}
                    onClick={() => {
                      productsPageState.cache.scrollPosition = window.scrollY;
                      productsPageState.isProductClick = true;
                      productsPageState.isBackNavigation = false;
                      productsPageState.cache.filteredProducts =
                        filteredProducts;
                      productsPageState.cache.filters = filters;
                    }}
                    className={`group relative bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-transform duration-300 ${
                      searchQuery
                        ? "flex flex-row items-start h-full"
                        : "flex flex-col h-full"
                    }`}
                  >
                    <div
                      className={`relative bg-gray-100 ${
                        searchQuery
                          ? "w-48 min-w-[12rem] h-full"
                          : "w-full h-50"
                      }`}
                    >
                      <div
                        className={`${
                          searchQuery ? "h-full" : "absolute inset-0"
                        } p-2`}
                      >
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-contain"
                        />
                      </div>
                    </div>
                    <div
                      className={`flex flex-col flex-grow p-3 sm:p-4 ${
                        searchQuery ? "min-h-[12rem]" : ""
                      }`}
                    >
                      <div>
                        <h3
                          className={`font-medium text-gray-900 line-clamp-2 ${
                            searchQuery ? "text-base" : "text-sm"
                          }`}
                        >
                          {(() => {
                            const rawQuery =
                              sessionStorage.getItem("matchedModel") || "";
                            const qComp = compact(rawQuery);
                            const name = product.name;
                            const modelList = product.model || [];

                            // use compacted comparison so "iphone11" matches "iPhone 11"
                            const matchingModels = modelList
                              .filter(
                                (m) => qComp && qComp.includes(compact(m))
                              )
                              .sort(
                                (a, b) => compact(b).length - compact(a).length
                              );

                            const matched = matchingModels[0];

                            if (
                              matched &&
                              name.includes("[") &&
                              name.includes("]")
                            ) {
                              return name.replace(/\[.*?\]/, matched);
                            }

                            // fallback: show the range
                            if (
                              modelList.length > 0 &&
                              name.includes("[") &&
                              name.includes("]")
                            ) {
                              const fallback = `${modelList[0]} - ${
                                modelList[modelList.length - 1]
                              }`;
                              return name.replace(/\[.*?\]/, fallback);
                            }

                            return name;
                          })()}
                        </h3>

                        {product.freeShipping && (
                          <div className="flex items-center mt-1 text-pink-600 text-xs gap-1">
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
                              className="w-4 h-4"
                            >
                              <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"></path>
                              <path d="M15 18H9"></path>
                              <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"></path>
                              <circle cx="17" cy="18" r="2"></circle>
                              <circle cx="7" cy="18" r="2"></circle>
                            </svg>
                            <span>Free Shipping</span>
                          </div>
                        )}
                      </div>
                      <div className="mt-2">
                        <p
                          className={`text-gray-600 line-clamp-2 ${
                            searchQuery ? "text-sm" : "text-xs"
                          }`}
                        >
                          {product.description}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {product.color?.slice(0, 3).map((c) => (
                            <span
                              key={c.colorName}
                              className="flex items-center gap-1 text-xs bg-gray-50 px-1.5 py-0.5 rounded-full border border-gray-100"
                            >
                              <span
                                className={`inline-block w-2 h-2 rounded-full ${getColorClass(
                                  c.colorName
                                )}`}
                                title={c.colorName}
                              />
                              <span className="capitalize">{c.colorName}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="mt-auto pt-3">
                        <div className="flex justify-between items-end">
                          <div>
                            <p className="text-sm font-semibold text-gray-900">
                              ${product.price.toFixed(2)}
                            </p>
                          </div>
                        </div>
                        <div className="flex justify-between items-center mt-1">
                          <p
                            className={`text-xs ${
                              product.stock > 0
                                ? "text-gray-600"
                                : "text-red-600"
                            }`}
                          >
                            <span
                              className={`w-2 h-2 rounded-full mr-1 inline-block ${
                                product.stock > 0
                                  ? "bg-green-500"
                                  : "bg-red-500"
                              }`}
                            />

                            {product.stock > 0
                              ? `${product.stock} in stock`
                              : "Out of stock"}
                          </p>
                          <div className="flex items-center">
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => {
                                const roundedRating =
                                  Math.round((product.rating || 0) * 2) / 2;

                                if (i + 1 <= roundedRating) {
                                  // Full star
                                  return (
                                    <svg
                                      key={i}
                                      className="h-3 w-3 text-yellow-400"
                                      xmlns="http://www.w3.org/2000/svg"
                                      viewBox="0 0 20 20"
                                      fill="currentColor"
                                    >
                                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                  );
                                } else if (i + 0.5 <= roundedRating) {
                                  // Half star
                                  return (
                                    <svg
                                      key={i}
                                      className="h-3 w-3 text-yellow-400"
                                      xmlns="http://www.w3.org/2000/svg"
                                      viewBox="0 0 20 20"
                                      fill="currentColor"
                                    >
                                      <path d="M10 15.27L4.24 18.39 5.64 12.97 1.1 8.63 6.92 7.97 10 2.5V15.27z" />
                                    </svg>
                                  );
                                } else {
                                  // Empty star
                                  return (
                                    <svg
                                      key={i}
                                      className="h-3 w-3 text-gray-300"
                                      xmlns="http://www.w3.org/2000/svg"
                                      viewBox="0 0 20 20"
                                      fill="currentColor"
                                    >
                                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                  );
                                }
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-lg shadow-sm">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <h3 className="mt-2 text-lg font-medium text-gray-900">
                  {searchQuery
                    ? `No products found for "${searchQuery}"`
                    : "No products found"}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchQuery
                    ? "Try different keywords"
                    : "Try adjusting your filters"}
                </p>
                <div className="mt-6">
                  <button
                    onClick={clearFilters}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-black hover:bg-gray-700"
                  >
                    Clear all filters
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Filter Component
const Filters = ({
  filters,
  handleFilterChange,
  categories,
  subcategories,
  colors,
}) => {
  return (
    <div className="space-y-8 bg-white p-6 rounded-lg shadow-sm">
      {/* Category Filter */}
      <div>
        <details open className="group">
          <summary className="cursor-pointer text-md font-medium text-gray-900 mb-2 flex justify-between items-center">
            Category
            <svg
              className="w-4 h-4 ml-2 transition-transform duration-200 group-open:rotate-180"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </summary>
          <div className="space-y-2 grid grid-cols-2">
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
                  {category?.replace("-", " ") || ""}
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
        </details>
      </div>

      {/* Subcategory Filter */}
      <div>
        <details className="group">
          <summary className="cursor-pointer text-md font-medium text-gray-900 mb-2 flex justify-between items-center">
            Sub Category
            <svg
              className="w-4 h-4 ml-2 transition-transform duration-200 group-open:rotate-180"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </summary>
          <div className="space-y-2 grid grid-cols-2">
            {subcategories.map((subcategory) => (
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
                  {subcategory?.replace("-", " ") || ""}
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
        </details>
      </div>

      {/* Color Filter */}
      <div>
        <details className="group">
          <summary className="cursor-pointer text-md font-medium text-gray-900 mb-2 flex justify-between items-center">
            Color
            <svg
              className="w-4 h-4 ml-2 transition-transform duration-200 group-open:rotate-180"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </summary>
          <div className="space-y-2 grid grid-cols-2">
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
        </details>
      </div>

      {/* Price Filter */}
      <div>
        <details className="group">
          <summary className="cursor-pointer text-md font-medium text-gray-900 mb-2 flex justify-between items-center">
            Price Range
            <svg
              className="w-4 h-4 ml-2 transition-transform duration-200 group-open:rotate-180"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </summary>
          <div className="space-y-4">
            <div className="flex justify-between text-sm text-gray-700">
              <span>${filters.priceRange[0]}</span>
              <span>${filters.priceRange[1]}</span>
            </div>
            <input
              type="range"
              min="0"
              max="200000"
              step="1000"
              value={filters.priceRange[1]}
              onChange={(e) =>
                handleFilterChange("priceRange", [
                  filters.priceRange[0],
                  parseInt(e.target.value),
                ])
              }
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
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
          </div>
        </details>
      </div>

      {/* In Stock Filter */}
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

export default Products;
