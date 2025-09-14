import { motion } from "framer-motion";

const TechSpinner = () => {
  return (
    <div className="flex items-center justify-center h-screen bg-white">
      <div className="relative w-24 h-24">
        {/* Outer Ring */}
        <motion.div
          className="absolute inset-0 border-4 border-blue-500 border-dashed rounded-full"
          animate={{ rotate: 360 }}
          transition={{
            repeat: Infinity,
            ease: "linear",
            duration: 2,
          }}
        />

        {/* Inner Ring (counter-rotating) */}
        <motion.div
          className="absolute inset-4 border-4 border-cyan-400 border-dotted rounded-full"
          animate={{ rotate: -360 }}
          transition={{
            repeat: Infinity,
            ease: "linear",
            duration: 1.5,
          }}
        />

        {/* Core pulse */}
        <motion.div
          className="absolute top-1/2 left-1/2 w-4 h-4 bg-blue-400 rounded-full shadow-lg"
          style={{ translateX: "-50%", translateY: "-50%" }}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{
            repeat: Infinity,
            duration: 1.2,
            ease: "easeInOut",
          }}
        />
      </div>
    </div>
  );
};

export default TechSpinner;
