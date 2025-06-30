import React from "react";
import { motion } from "framer-motion";

const ProgressTube = ({ amount }) => {
  const progressPercent = amount ? Math.min((amount / 470000000) * 100, 100) : 0;

  console.log("💡 ProgressTube received amount:", amount, "→", progressPercent.toFixed(2), "%");

  return (
    <section className="relative py-20 px-4 text-white text-center">
      <motion.h2
        initial={{ opacity: 0, y: -40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="text-4xl font-bold mb-10"
      >
        BERTH Token Presale
      </motion.h2>

      <div className="w-full max-w-4xl mx-auto h-14 relative bg-gray-900 rounded-full overflow-hidden shadow-lg border-4 border-red-500">
        <motion.div
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 1 }}
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-red-500 to-red-800 rounded-full z-10"
        />
        <div className="absolute inset-0 flex items-center justify-center font-bold font-mono z-20">
          {amount
            ? `$${amount.toLocaleString()} / $470,000,000  `
            : "Loading..."}
        </div>
      </div>
    </section>
  );
};

export default ProgressTube;
