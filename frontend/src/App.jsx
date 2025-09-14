import React, { useState, useEffect, useRef } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import ProductPage from "./pages/ProductPage";
import Footer from "./components/Footer";
import NotFound from "./components/NotFound";
import AuthPage from "./pages/AuthPage";
import FAQPage from "./pages/FAQPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import { OrderPage } from "./pages/OrderPage";
import { Toaster } from "react-hot-toast";
import ProductsListPage from "./pages/ProductsListPage.jsx";
import ContactPage from "./pages/ContactPage.jsx";
import AboutPage from "./pages/AboutPage.jsx";
import ScrollToTop from "./components/ScrollToTop.jsx";
import { useProductStore } from "./store/useProductStore.js";
import ProfilePage from "./pages/ProfilePage.jsx";
import WishlistPage from "./pages/WishlistPage.jsx";
import AboutUs from "./pages/AboutUs.jsx";
import CareersPage from "./pages/CareersPage.jsx";
import Loadertest from "./pages/Loadertest.jsx";
import TopBrandsPage from "./pages/TopBrandsPage.jsx";
import { v4 as uuidv4 } from "uuid";
import { useUserPing } from "./hooks/useUserPing.js";
import PWAInstall from "./components/PWAInstall.jsx";
import AuthSuccess from "./components/AuthSuccess.jsx";
import { useAuthStore } from "./store/useAuthStore.js";
import "leaflet/dist/leaflet.css";
import SearchBox from "./pages/SearchUI.jsx";
import SvgLoader from "./components/SvgLoader.jsx";
import { motion, useInView } from "framer-motion";
import Chatbot from "./components/Chatbot.jsx";
const userId = uuidv4();

function App() {
  const [products, setProducts] = useState([]);
  const { authUser, checkAuth, isCheckingAuth, onlineUsers } = useAuthStore();
  const { fetchedProducts, isFetching, fetchProducts } = useProductStore();
  const footerRef = useRef(null);
  const footerInView = useInView(footerRef, {
    once: true,
    amount: 0.2, // fire when ~20% of footer is visible
    margin: "0px 0px 0px 0px", // remove negative bottom margin
  });

  useUserPing(authUser);

  useEffect(() => {
    checkAuth();
    fetchProducts();
  }, [checkAuth, fetchProducts]);

  useEffect(() => {
    setProducts(fetchedProducts);
  }, [fetchedProducts]);

  return (
    <Router>
      <ScrollToTop />
      <div className="min-h-screen flex flex-col bg-gray-50">
        <div className="flex-grow">
          <Routes>
            <Route path="/" element={<LandingPage products={products} />} />
            <Route path="/products/:modelName" element={<ProductPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="*" element={<NotFound />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/help" element={<FAQPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/order" element={<OrderPage />} />
            <Route path="/products" element={<ProductsListPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route
              path="/profile"
              element={
                isCheckingAuth ? (
                  <div className="min-h-screen flex items-center justify-center">
                    <SvgLoader />
                  </div>
                ) : authUser ? (
                  <ProfilePage />
                ) : (
                  <Navigate to="/auth" replace />
                )
              }
            />
            <Route path="/wishlist" element={<WishlistPage />} />
            <Route path="/careers" element={<CareersPage />} />
            <Route path="/top-brands" element={<TopBrandsPage />} />
            <Route path="loader" element={<Loadertest />} />
            <Route path="/aboutus" element={<AboutUs />} />
            <Route path="loader" element={<Loadertest />} />
            <Route path="/install" element={<PWAInstall />} />
            <Route path="/auth-success" element={<AuthSuccess />} />
            <Route path="/search" element={<SearchBox />} />
          </Routes>

          <Toaster />
        </div>
        <motion.section
          ref={footerRef}
          initial={false}
          animate={footerInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 32 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="will-change-transform"
        >
          <Footer />
        </motion.section>
        <Chatbot />
      </div>
    </Router>
  );
}

export default App;
