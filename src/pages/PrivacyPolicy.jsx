import React from "react";
import { motion } from "framer-motion";
import Logo from "../assets/logo.svg"; // Make sure the path is correct
import Navbar from "../components/Navbar"; // ✅ Import Navbar
import Footer from "../components/Footer";

const PrivacyPolicy = () => {
  return (
    <>
      <Navbar />
      <motion.div
        className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-black to-gray-900 text-white p-6 md:p-10"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Logo at the top center */}
        <div className="w-full flex justify-center mb-10">
          <img
            src={Logo}
            alt="BERTH Logo"
            className="h-16 md:h-20 drop-shadow-[0_0_8px_red]"
          />
        </div>

        <h1 className="text-4xl font-bold mb-8 drop-shadow text-red-500 text-center">
          Privacy Policy
        </h1>

        <div className="max-w-3xl mx-auto space-y-6 text-gray-300 leading-relaxed">
          <p>
            We value your privacy. The BERTH Token project does not collect or share
            any personal information unless explicitly authorized. All transactions
            are conducted on-chain and publicly verifiable.
          </p>

          <p>
            This website does not use cookies or trackers. Your wallet connection is
            solely used for token interaction purposes.
          </p>

          <p>
            Any personal data shared via contact forms, whitelist applications or
            other off-chain platforms will be handled with strict confidentiality.
            We do not sell or distribute user information.
          </p>

          <p>
            By using this platform, you agree to these terms. Updates to this policy
            will be posted here.
          </p>
        </div>
        <Footer />

      </motion.div>
    </>
  );
};

export default PrivacyPolicy;
