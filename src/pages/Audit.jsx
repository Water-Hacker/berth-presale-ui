import React from "react";
import { motion } from "framer-motion";
import Footer from "../components/Footer";

import Navbar from "../components/Navbar";

const AuditNotice = () => {
  return (
    <>
      <Navbar />
      <motion.div
        className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-black to-gray-900 text-white px-6 py-12 md:px-20 flex flex-col items-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-3xl bg-black/50 p-8 rounded-3xl border border-red-600 shadow-[0_0_25px_rgba(255,0,0,0.4)]">
          <h1 className="text-4xl font-extrabold text-center text-red-500 mb-6 drop-shadow-[0_0_10px_red]">
            🔒 Audit Confidentiality Notice
          </h1>

          <p className="text-gray-300 leading-relaxed text-lg mb-6">
            To our valued investors,
          </p>

          <p className="text-gray-300 leading-relaxed mb-4">
            The security and integrity of the <span className="text-red-400 font-semibold">BERTH</span> project remain our highest priority. While a
            thorough third-party audit has been completed to ensure the reliability of our
            smart contracts, the full report is currently kept confidential.
          </p>

          <p className="text-gray-300 leading-relaxed mb-4">
            This deliberate step is taken to prevent any potential exploitation or reverse
            engineering of contract logic before our official deployment. It's a common
            security measure for projects of this magnitude.
          </p>

          <p className="text-gray-300 leading-relaxed mb-4">
            Once we officially deploy the platform, the <span className="text-red-400 font-semibold">full audit report</span> will be made public to ensure full transparency
            and confidence in our ecosystem.
          </p>

          <p className="text-gray-300 leading-relaxed">
            Thank you for your trust, patience, and unwavering support as we prepare for a
            secure and impactful launch.
          </p>

          <p className="text-gray-400 italic mt-6 text-right">— The BERTH Team</p>
        </div>
        <Footer />

      </motion.div>
    </>
  );
};

export default AuditNotice;
