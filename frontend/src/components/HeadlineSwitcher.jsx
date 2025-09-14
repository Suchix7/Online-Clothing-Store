// ✅ Top-level imports (must be at the top)
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const headlines = [
  "Trusted by Thousands. Loved by All. 💙",
  "100% Satisfied Customers Across Nepal.",
  "Nepal’s Most Reliable Tech Marketplace. ⚡",
  "Fast Delivery. Genuine Products. 100% Satisfaction.",
  "Your Trusted Destination for All Things Tech. 🛒",
  "Serving 100% Happy Customers & Growing Every Day.",
  "Tech You Can Trust. Service You’ll Love. ✅",
  "100% Satisfaction Guaranteed.",
  "Thousands of Happy Shoppers. One Trusted Brand",
  "Genuine Products. Smooth Experience. 100% Satisfaction.",
  "From Phones to Smart Homes—We’ve Got You Covered! 🔧📱🏠",
];

const getRandomHeadline = () => {
  return headlines[Math.floor(Math.random() * headlines.length)];
};

const HeadlineSwitcher = () => {
  const [headline, setHeadline] = useState(getRandomHeadline());

  useEffect(() => {
    const interval = setInterval(() => {
      setHeadline(getRandomHeadline());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={headline}
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -10 }}
        transition={{ duration: 0.5 }}
      >
        <span className="hidden md:inline italic hover:text-gray-200 transition-colors">
          {headline}
        </span>
      </motion.div>
    </AnimatePresence>
  );
};

export default HeadlineSwitcher;
