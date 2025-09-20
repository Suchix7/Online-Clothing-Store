import { useState, useEffect, useMemo, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  FaSearch,
  FaUser,
  FaShoppingCart,
  FaBars,
  FaTimes,
  FaHeart,
} from "react-icons/fa";
import { useAuthStore } from "../store/useAuthStore.js";
import { motion } from "framer-motion";
import { axiosInstance } from "../lib/axiosInstance.js";
import useDebounce from "../utils/useDebounce";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const { authUser, logout } = useAuthStore();
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [products, setProducts] = useState([]);
  const [searchActive, setSearchActive] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [showNavbar, setShowNavbar] = useState(true);
  const searchInputRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const debouncedQuery = useDebounce(searchQuery, 200);
  // Put at top-level of the file or in a small module
  const NORMALIZE = (s) => {
    if (s === null || s === undefined) return "";
    return String(s)
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^\w\s]/g, "")
      .trim();
  };
  // RIGHT BELOW NORMALIZE
  const getModelStrings = (obj) => {
    const v = obj?.model;
    if (Array.isArray(v)) {
      return v
        .filter(Boolean)
        .map((m) => String(m).trim())
        .filter(Boolean);
    }
    if (v === null || v === undefined) return [];
    return [String(v).trim()].filter(Boolean);
  };

  const fieldWeights = {
    name: 4, // product.name is most important
    model: 5, // if you have model field (or parse from name), give it priority
    brand: 3, // brand/category-level terms
    category: 2,
    subcategory: 2,
    description: 1,
  };

  const synonyms = new Map([
    ["sp", "screen protector"],
    ["cover", "case"],
    ["back cover", "case"],
    ["cellphone", "phone"],
    ["mobile", "phone"],
    // add more as you see queries
  ]);

  function expandQueryTokens(q) {
    const base = NORMALIZE(q).split(/\s+/).filter(Boolean);
    const expanded = new Set(base);
    for (const t of base) {
      const syn = synonyms.get(t);
      if (syn) syn.split(/\s+/).forEach((x) => expanded.add(x));
    }
    return Array.from(expanded);
  }

  function prefixMatchScore(token, text) {
    // grant prefix matches (fast) and small fuzzy tolerance (edit distance <=1) for short tokens
    if (!token || !text) return 0;
    if (text.startsWith(token)) return 1;
    if (token.length >= 3 && Math.abs(token.length - text.length) <= 1) {
      // tiny fuzzy check: one substitution allowed
      let miss = 0;
      for (let i = 0; i < Math.min(token.length, text.length); i++) {
        if (token[i] !== text[i]) miss++;
        if (miss > 1) return 0;
      }
      return 0.6;
    }
    return 0;
  }

  function scoreProduct(product, tokens) {
    const brand = NORMALIZE(product.brand || product.category || "");
    const allModels = getModelStrings(product);
    const model = NORMALIZE(allModels.join(" ")); // join all models for scoring
    const name = NORMALIZE(product.name || "");
    const cat = NORMALIZE(product.category || "");
    const subcat = NORMALIZE(product.subcategory || "");
    const desc = NORMALIZE(product.description || "");

    const fields = [
      ["model", model],
      ["name", name],
      ["brand", brand],
      ["category", cat],
      ["subcategory", subcat],
      ["description", desc],
    ];

    let score = 0;
    for (const t of tokens) {
      let tokenHit = 0;
      for (const [key, text] of fields) {
        if (!text) continue;
        const words = text.split(/\s+/);

        // contains bonus
        if (text.includes(t)) {
          tokenHit = Math.max(tokenHit, 0.8 * fieldWeights[key]);
        }

        // word-prefix match bonus (with tiny fuzz)
        for (const w of words) {
          const pm = prefixMatchScore(t, w);
          if (pm) tokenHit = Math.max(tokenHit, pm * 1.0 * fieldWeights[key]);
        }
      }
      score += tokenHit;
    }

    // minor quality/availability boosts
    score += Math.max(0, 2 - name.split(" ").length / 5);
    if (product.inStock) score += 0.5;
    if (product.salesCount) score += Math.min(1.5, product.salesCount / 1000);

    return score;
  }

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        // Scrolling down & past a small threshold → hide
        setShowNavbar(false);
      } else {
        // Scrolling up → show
        setShowNavbar(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  // Fetch products for search suggestions
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axiosInstance.get("/product");
        setProducts(response.data);
      } catch (error) {
        console.error("Error fetching products:", error);
        setProducts([]);
      }
    };
    fetchProducts();
  }, []);

  // Update cart count to push
  const updateCartCount = () => {
    try {
      const cartData = sessionStorage.getItem("cart");
      const cartItems = cartData ? JSON.parse(cartData) : [];
      const totalItems = Array.isArray(cartItems)
        ? cartItems.reduce((total, item) => total + (item.quantity || 0), 0)
        : 0;
      setCartCount(totalItems);
    } catch (error) {
      console.error("Error updating cart count:", error);
      setCartCount(0);
    }
  };

  useEffect(() => {
    updateCartCount();
    const handleCartUpdate = () => updateCartCount();
    window.addEventListener("cartUpdated", handleCartUpdate);
    return () => window.removeEventListener("cartUpdated", handleCartUpdate);
  }, []);

  // Handle search form submission
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Reset any existing search params
      const newSearch = `?search=${encodeURIComponent(searchQuery.trim())}`;

      // If already on products page, replace the current entry to avoid duplicate history entries
      if (location.pathname === "/products") {
        sessionStorage.setItem(
          "matchedModel",
          searchQuery.toLowerCase().trim()
        );

        navigate(
          {
            pathname: "/products",
            search: newSearch,
          },
          { replace: true }
        );
      } else {
        sessionStorage.setItem(
          "matchedModel",
          searchQuery.toLowerCase().trim()
        );

        // If coming from another page, add a new entry to history
        navigate({
          pathname: "/products",
          search: newSearch,
        });
      }

      // Clear search state
      setSearchQuery("");
      setSearchSuggestions([]);
      setSearchActive(false);
      setShowSearch(false);
    }
  };

  // Handle search input focus
  const handleSearchFocus = () => {
    setSearchActive(true);
  };

  // Generate predictive search suggestions
  // Replace your suggestions effect with this:
  useEffect(() => {
    if (
      !searchActive ||
      !debouncedQuery ||
      !debouncedQuery.trim() ||
      products.length === 0
    ) {
      setSearchSuggestions([]);
      return;
    }

    const rawQ = debouncedQuery.trim();
    const tokens = expandQueryTokens(rawQ);

    // Optional business rule from your earlier requirements:
    // If user typed a model like "iPhone 12 Pro" but NOT "screen protector"/"cover",
    // deprioritize matches that are clearly accessories (subcategory includes 'screen protector' or 'case')
    const isAccessoryQuery = /screen\s*protector|cover|case/i.test(rawQ);

    const scored = products.map((p) => {
      let s = scoreProduct(p, tokens);
      // deprioritize accessories unless user explicitly asked
      const sub = NORMALIZE(p.subcategory || "");
      if (!isAccessoryQuery && /(screen protector|cover|case)/.test(sub))
        s -= 2;
      return { p, s };
    });

    scored.sort((a, b) => b.s - a.s);

    // Create top textual suggestions from top products:
    // prefer model -> name -> brand + model
    const seen = new Set();
    const texts = [];
    for (const { p, s } of scored) {
      if (s <= 0) break;
      // BEFORE (buggy used p.model?.trim())
      // AFTER:
      const models = getModelStrings(p);
      const firstModel = models[0];

      const candidates = [
        ...models, // add each model as a separate suggestion
        p.name?.trim(),
        [p.brand, firstModel].filter(Boolean).join(" "),
        [p.brand, p.name].filter(Boolean).join(" "),
      ].filter(Boolean);

      for (const c of candidates) {
        const key = c.toLowerCase();
        if (!seen.has(key) && NORMALIZE(c).length > NORMALIZE(rawQ).length) {
          seen.add(key);
          texts.push(c);
          break;
        }
      }
      if (texts.length >= 8) break;
    }

    setSearchSuggestions(texts);
  }, [debouncedQuery, products, searchActive]);

  // Simplify the suggestion display
  const renderSuggestion = (suggestion) => {
    const query = searchQuery.toLowerCase().trim();
    return (
      <p className="text-sm text-gray-800">
        {suggestion.split("").map((char, i) => {
          const isHighlighted =
            i < query.length && char.toLowerCase() === query[i]?.toLowerCase();
          return (
            <span
              key={i}
              className={`${isHighlighted ? "text-gray-500" : "font-medium"}`}
            >
              {char}
            </span>
          );
        })}
      </p>
    );
  };

  // Handle suggestion click with smooth transition
  const handleSuggestionClick = (suggestion) => {
    setSearchQuery(suggestion);

    setTimeout(() => {
      const newSearch = `?search=${encodeURIComponent(suggestion)}`;

      -sessionStorage.setItem("matchedModel", searchQuery.toLowerCase().trim());
      +sessionStorage.setItem("matchedModel", suggestion.toLowerCase().trim());

      if (location.pathname === "/products") {
        navigate(
          { pathname: "/products", search: newSearch },
          { replace: true }
        );
      } else {
        navigate({ pathname: "/products", search: newSearch });
      }

      setSearchSuggestions([]);
      setSearchActive(false);
      setShowSearch(false);
    }, 100);
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target)
      ) {
        setSearchActive(false);
        setSearchSuggestions([]);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <nav
      className={`shadow-md px-4 md:px-8 lg:px-40 py-4 flex items-center justify-between bg-white z-50 sticky top-0 ${
        showNavbar ? "translate-y-0" : "-translate-y-full"
      } transition-transform duration-300`}
    >
      {/* Left: Logo & Burger */}
      <div className="flex items-center space-x-4">
        <FaBars
          className="text-xl text-black cursor-pointer lg:hidden"
          onClick={() => setMenuOpen(true)}
        />
        <Link to="/" className="hover:brightness-50 brightness-0 ">
          <img src="../logo.png" alt="Logo" className="w-18 md:w-22" />
        </Link>
      </div>

      {/* Center: Nav Links */}
      <ul className="hidden lg:flex space-x-6 text-black">
        <li>
          <Link
            to="/"
            className={`hover:text-gray-600 transition-colors ${
              location.pathname === "/" ? "font-bold" : "font-normal"
            }`}
          >
            HOME
          </Link>
        </li>

        <li>
          <Link
            to="/products"
            className={`hover:text-gray-600 transition-colors ${
              location.pathname.startsWith("/products")
                ? "font-bold"
                : "font-normal"
            }`}
          >
            PRODUCTS
          </Link>
        </li>
        <li>
          <Link
            to="/aboutus"
            className={`hover:text-gray-600 transition-colors ${
              location.pathname === "/aboutus" ? "font-bold" : "font-normal"
            }`}
          >
            ABOUT US
          </Link>
        </li>
        <li>
          <Link
            to="/contact"
            className={`hover:text-gray-600 transition-colors ${
              location.pathname === "/contact" ? "font-bold" : "font-normal"
            }`}
          >
            CONTACT US
          </Link>
        </li>

        <li>
          <Link
            to="/help"
            className={`hover:text-gray-600 transition-colors ${
              location.pathname === "/help" ? "font-bold" : "font-normal"
            }`}
          >
            HELP
          </Link>
        </li>

        {authUser && (
          <li>
            <Link
              to="/order"
              className={`hover:text-gray-600 transition-colors ${
                location.pathname === "/order" ? "font-bold" : "font-normal"
              }`}
            >
              ORDERS
            </Link>
          </li>
        )}
      </ul>

      {/* Right: Icons */}
      <div className="flex items-center space-x-4 md:space-x-6 text-black">
        {/* Desktop Search */}
        <div
          className="hidden xl:block w-50 md:w-45 relative"
          ref={searchInputRef}
        >
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={handleSearchFocus}
              className="w-full pl-10 pr-4 py-1 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black"
            />
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg" />

            {/* Search suggestions dropdown */}
            {searchActive && searchSuggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-80 overflow-y-auto"
              >
                {searchSuggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="p-2 hover:bg-gray-100 cursor-pointer transition-colors duration-150"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    {renderSuggestion(suggestion)}
                  </div>
                ))}
              </motion.div>
            )}
          </form>
        </div>

        {/* Mobile Search Toggle */}
        <div className="xl:hidden">
          <FaSearch
            className="text-xl cursor-pointer"
            onClick={() => {
              setShowSearch(!showSearch);
              setSearchActive(!showSearch);
            }}
          />
        </div>

        {/* Auth */}
        {authUser ? (
          <Link to="/profile">
            <div className="flex items-center cursor-pointer whitespace-nowrap hover:opacity-50 transition duration-300">
              <FaUser className="mr-1" />
              <span className="hidden md:inline">Profile</span>
            </div>
          </Link>
        ) : (
          <Link to="/auth">
            <div className="flex items-center cursor-pointer whitespace-nowrap border rounded-xl px-4 py-2 text-black transition duration-300 hover:-translate-y-[2px]">
              <FaUser className="mr-1" />
              <span className="hidden md:inline">Sign In</span>
            </div>
          </Link>
        )}

        {/* Wishlist */}
        <Link to="/wishlist" className="cursor-pointer hover:text-gray-600">
          <div className="flex items-center relative whitespace-nowrap">
            <FaHeart className="text-xl text-pink-500 transition duration-300 hover:-translate-y-[2px]" />
          </div>
        </Link>

        {/* Cart */}
        <Link
          to="/cart"
          className="cursor-pointer hover:text-green-500 transition duration-300 hover:-translate-y-[2px]"
        >
          <div className="flex items-center relative whitespace-nowrap">
            <FaShoppingCart className="text-xl" />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-3 bg-red-600 text-white text-xs font-bold rounded-full px-2 py-0.5">
                {cartCount}
              </span>
            )}
          </div>
        </Link>
      </div>

      {/* Mobile Search Bar */}
      {showSearch && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-full left-0 right-0 bg-white py-3 px-4 shadow-md z-40 xl:hidden"
          ref={searchInputRef}
        >
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchActive(true)}
              className="w-full pl-10 pr-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg" />

            {/* Mobile search suggestions */}
            {searchActive && searchSuggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto"
              >
                {searchSuggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="p-2 hover:bg-gray-100 cursor-pointer transition-colors duration-150"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    {renderSuggestion(suggestion)}
                  </div>
                ))}
              </motion.div>
            )}
          </form>
        </motion.div>
      )}

      {/* Mobile Menu */}
      <motion.div
        initial={{ x: "-100%" }}
        animate={{ x: menuOpen ? 0 : "-100%" }}
        transition={{ type: "easeOut", stiffness: 120 }}
        className="fixed top-0 left-0 w-3/4 sm:w-1/2 h-[107vh] bg-black text-white flex flex-col items-center py-20 shadow-lg z-50 overflow-y-auto"
      >
        <FaTimes
          className="absolute top-10 right-5 text-2xl cursor-pointer"
          onClick={() => setMenuOpen(false)}
        />
        <ul
          className="space-y-4 text-lg w-full px-6"
          onClick={() => setMenuOpen(false)}
        >
          <li
            className={`border-b border-gray-700 pb-2 ${
              location.pathname === "/" ? "font-bold" : "font-normal"
            }`}
          >
            <Link to="/" className="block w-full">
              Home
            </Link>
          </li>

          <li
            className={`border-b border-gray-700 pb-2 ${
              location.pathname.startsWith("/products")
                ? "font-bold"
                : "font-normal"
            }`}
          >
            <Link to="/products" className="block w-full">
              Products
            </Link>
          </li>
          <li
            className={`border-b border-gray-700 pb-2 ${
              location.pathname === "/contact" ? "font-bold" : "font-normal"
            }`}
          >
            <Link to="/contact" className="block w-full">
              Contact Us
            </Link>
          </li>
          <li
            className={`border-b border-gray-700 pb-2 ${
              location.pathname === "/help" ? "font-bold" : "font-normal"
            }`}
          >
            <Link to="/help" className="block w-full">
              Help
            </Link>
          </li>
          {authUser && (
            <li
              className={`border-b border-gray-700 pb-2 ${
                location.pathname === "/order" ? "font-bold" : "font-normal"
              }`}
            >
              <Link to="/order" className="block w-full">
                Orders
              </Link>
            </li>
          )}
          <li className="border-b border-gray-700 pb-2">
            {authUser ? (
              <div onClick={logout} className="cursor-pointer block w-full">
                Logout
              </div>
            ) : (
              <Link to="/auth" className="block w-full">
                Sign In
              </Link>
            )}
          </li>
        </ul>
      </motion.div>

      {/* Overlay */}
      {menuOpen && (
        <div
          className="fixed inset-0  bg-opacity-50 z-40 lg:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}
    </nav>
  );
};

export default Navbar;
