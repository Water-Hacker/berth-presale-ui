import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

const formatNumber = (num) => num.toLocaleString("en-US");

const StatsPanel = ({ currentAmount, targetAmount = 447000000 }) => {
  const [growthRate, setGrowthRate] = useState(0);
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    // Simulate growth between $20k - $30k every hour
    const rate = Math.floor(Math.random() * 10000) + 20000;
    setGrowthRate(rate);

    // Countdown timer: 3 months from now (approx)
    const THREE_MONTHS_MS = Math.round(3 * 30.4375 * 24 * 60 * 60 * 1000);
    const deadline = Date.now() + THREE_MONTHS_MS;
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const diff = deadline - now;

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      className="grid md:grid-cols-4 gap-4 w-full max-w-5xl text-center mt-8"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.8 }}
    >
      {[
        {
          label: "Raised",
          value: `$${formatNumber(currentAmount)}`,
          glow: "from-green-400 to-lime-500",
        },
        {
          label: "Target",
          value: `$${formatNumber(targetAmount)}`,
          glow: "from-yellow-400 to-orange-500",
        },
        {
          label: "Growth/hr",
          value: `+$${formatNumber(growthRate)}`,
          glow: "from-sky-400 to-blue-600",
        },
        {
          label: "Time Left",
          value: timeLeft,
          glow: "from-purple-400 to-pink-600",
        },
      ].map(({ label, value, glow }, index) => (
        <div
          key={index}
          className={`bg-[#111] rounded-2xl shadow-lg p-6 border border-gray-700 transform transition hover:scale-105`}
        >
          <h3 className={`text-lg font-semibold text-gray-300 mb-1`}>
            {label}
          </h3>
          <p
            className={`text-xl font-bold bg-gradient-to-r ${glow} text-transparent bg-clip-text drop-shadow-[0_0_10px_#ffffff22]`}
          >
            {value}
          </p>
        </div>
      ))}
    </motion.div>
  );
};

export default StatsPanel;
