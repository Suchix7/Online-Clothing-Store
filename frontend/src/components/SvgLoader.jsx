import React from "react";

const SvgLoader = ({ forCheckout }) => {
  const size = forCheckout ? "w-[28px] h-[28px]" : "w-[100px] h-[100px]";
  return (
    <div
      className={`relative flex items-center justify-center ${size}`}
      aria-label="Loading"
    >
      <div className="w-full h-full rounded-full border-4 border-black/20 border-t-orange-400 animate-spin" />
    </div>
  );
};

export default SvgLoader;
