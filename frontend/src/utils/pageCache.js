// Separate caches for different page types
const pageCache = {
  // For brand/category pages
  brandPage: {
    cache: {},
    lastScrollPosition: 0,
    lastBrand: null,
  },

  // For products listing page
  productsPage: {
    cache: null,
    lastScrollPosition: 0,
    filters: null, // To store any active filters
  },

  // For individual product pages
  productPage: {
    cache: {},
    lastScrollPosition: 0,
    lastProductId: null,
  },
};

export default pageCache;
