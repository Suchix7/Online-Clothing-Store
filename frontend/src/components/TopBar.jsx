import React from "react";
import { FaLocationDot, FaTruckFast } from "react-icons/fa6";
import { FaQuestionCircle } from "react-icons/fa";
import { LuBadgePercent } from "react-icons/lu";
import { Link } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore.js";
import { AnimatePresence, motion } from "framer-motion";
import HeadlineSwitcher from "./HeadlineSwitcher.jsx";

const TopBar = () => {
  const { authUser } = useAuthStore();

  // All phrases now include {name} placeholder
  const phrases = [
    "🙏 Hey {name}, it's {day}! Welcome to YugTech!",
    "🙏 Happy {day} {name}! Explore amazing deals!",
    "🙏 It's {day} {name}! Relax and shop with us!",
    "🙏 Welcome {name}, Start your {day} with YugTech!",
    "🙏 Hello {name}, Find the best tech deals this {day}!",
    "🙏 Let's kickstart this {day} together {name}!",
    "🙏 Namaste {name}, Grab hot {day} deals at YugTech!",
    "🙏 Discover innovations this {day} {name}!",
    "🙏 Shop smart this {day} {name} with YugTech!",
    "🙏 Hi {name}, {day} Shopping made easy with us!",
    "🙏 Find your {day} tech essentials {name}!",
    "🙏 Welcome {name}, Let us deliver happiness this {day}!",
    "🙏 Celebrate {day} with us {name}!",
    "🙏 Hello {name}, Upgrade your tech this {day}!",
    "🙏 Fast {day} delivery for you {name}!",
    "🙏 Enjoy {day} vibes with us {name}!",
    "🙏 Hi {name}, Shop and save big this {day}!",
    "🙏 Hey {name}, Get your {day} tech delivered fast!",
  ];

  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  const getDayMessage = () => {
    const today = new Date().getDay();
    const currentDay = days[today];
    const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];

    let message = randomPhrase
      .replace(/\{day\}/g, currentDay)
      .replace(/\{name\}/g, authUser?.fullName || "");

    return message;
  };

  return (
    <div className="hidden md:flex text-white p-2 bg-black px-10 lg:px-20 xl:px-40 items-center justify-between text-[12px]">
      <p className="flex items-center gap-2">{getDayMessage()}</p>
      <div>
        <div className="flex items-center gap-2">
          <AnimatePresence mode="wait">
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.5 }}
            >
              <span className="hidden md:inline italic hover:text-gray-200 transition-colors animate-pulse">
                100% Satisfied Customers across Nepal.
              </span>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      {/* <div className="flex gap-6 lg:gap-10">
        <p className="flex items-center gap-2">
          <FaLocationDot className="text-black" />
          +977-9800000000
        </p>
        <p className="flex items-center gap-2">
          <FaTruckFast className="text-black" />
          Fast Delivery!
        </p>
        <p className="flex items-center gap-2">
          <LuBadgePercent className="text-black" />
          Special Discounts Available!
        </p>
      </div> */}
    </div>
  );
};

export default TopBar;
