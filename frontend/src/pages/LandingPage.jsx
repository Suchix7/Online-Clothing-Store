import React, { useEffect } from "react";
import TopBar from "../components/TopBar";
import Hero from "../components/Hero";
import Navbar from "../components/Navbar";
import BottomBar from "../components/BottomBar";
import ProductListing from "../components/ProductListing";
import Category from "../components/Categories";
import TopBrands from "../components/TopBrands";
import { Loader } from "lucide-react";
import Banner from "../components/Banner";
import Banner2 from "../components/Banner2";
import RecentlyViewed from "../components/RecentlyViewed";
import SvgLoader from "../components/SvgLoader";
import { axiosInstance } from "../lib/axiosInstance.js";
import { useAuthStore } from "../store/useAuthStore.js";
import CustomerTestimonials from "../components/CustomerTestimonials.jsx";
import Recommendation from "../components/Recommendation.jsx";
import { motion } from "framer-motion";

// Reusable slide-up on scroll wrapper
const SlideUpSection = ({ children, delay = 0 }) => (
  <motion.section
    initial={{ opacity: 0, y: 32 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.2, margin: "0px 0px -100px 0px" }}
    transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay }}
    className="will-change-transform"
  >
    {children}
  </motion.section>
);

const LandingPage = ({ products }) => {
  const { authUser, token } = useAuthStore();

  useEffect(() => {
    const checkCart = localStorage.getItem("cart");
    const cart = checkCart ? JSON.parse(checkCart) : [];

    if (!authUser || !cart.length) return;

    const syncCart = async () => {
      try {
        const payload = {
          userId: authUser._id,
          items: cart.map((item) => ({
            ...item,
            quantity: Number(item.quantity),
          })),
        };

        await axiosInstance.post("/cart/sync", payload);
        localStorage.removeItem("cart");
      } catch (error) {
        console.error("Error syncing cart:", error);
      }
    };

    syncCart();
  }, [authUser?._id]);

  return (
    <div>
      {products ? (
        <>
          <TopBar />
          <Navbar />
          <SlideUpSection>
            <Hero products={products} />
          </SlideUpSection>

          <SlideUpSection delay={0.05}>
            <Category />
          </SlideUpSection>

          <SlideUpSection delay={0.1}>
            <RecentlyViewed products={products} />
          </SlideUpSection>

          <SlideUpSection delay={0.15}>
            <ProductListing product={products} category="Shoes" />
          </SlideUpSection>

          <SlideUpSection delay={0.2}>
            <Banner product={products} />
          </SlideUpSection>

          <SlideUpSection delay={0.25}>
            <ProductListing product={products} category="Shirts" />
          </SlideUpSection>

          <SlideUpSection delay={0.3}>
            <CustomerTestimonials />
          </SlideUpSection>

          <SlideUpSection delay={0.35}>
            <Banner2 products={products} />
          </SlideUpSection>

          <SlideUpSection delay={0.4}>
            <ProductListing product={products} category="Pants" />
          </SlideUpSection>

          <SlideUpSection delay={0.45}>
            <Recommendation />
          </SlideUpSection>

          <SlideUpSection delay={0.5}>
            <TopBrands />
          </SlideUpSection>
        </>
      ) : (
        <div className="min-h-screen flex justify-center items-center">
          <SvgLoader />
        </div>
      )}
    </div>
  );
};

export default LandingPage;
