import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Logo from "../assets/logo.svg";
// Removed LanguageSwitcher import
import { useTranslation } from "react-i18next";

// Dynamic countdown: 3 months from now
const THREE_MONTHS_MS = Math.round(3 * 30.4375 * 24 * 60 * 60 * 1000); // approx. 3 months

const Navbar = () => {
  const [currentTime, setCurrentTime] = useState("");
  const [countdown, setCountdown] = useState("");
  const { t } = useTranslation();

  useEffect(() => {
    // compute target once on mount
    const target = new Date(Date.now() + THREE_MONTHS_MS);

    const updateTime = () => {
      const now = new Date();
      const options = {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      };
      setCurrentTime(now.toLocaleString("en-US", options));

  const diff = target - now;
      if (diff <= 0) {
        setCountdown("LIVE");
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / (1000 * 60)) % 60);
        const seconds = Math.floor((diff / 1000) % 60);
        setCountdown(`${days}d ${hours}h ${minutes}m ${seconds}s`);
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="bg-black shadow-md px-3 py-2 md:px-4 md:py-3 flex flex-col md:flex-row md:justify-between md:items-center gap-3 md:gap-0 border-b border-red-600 backdrop-blur-md">
      
      {/* Logo & Title */}
      <div className="flex items-center gap-2">
        <img
          src={Logo}
          alt="BERTH Logo"
          className="h-6 w-6 md:h-8 md:w-auto drop-shadow-[0_0_5px_red]"
        />
        <h2 className="text-white font-semibold text-base md:text-lg drop-shadow-[0_0_6px_red]">
          BERTH
        </h2>
      </div>

      {/* Navigation Links */}
      <nav className="flex flex-wrap justify-center gap-3 md:gap-5 text-white text-xs md:text-sm font-medium">
        <Link to="/" className="hover:text-red-500 transition">{t("Dashboard")}</Link>
        <Link to="/whitelist" className="hover:text-red-500 transition">{t("Tokenomics")}</Link>
        <Link to="/roadmap" className="hover:text-red-500 transition">{t("Roadmap")}</Link>
        <Link to="/audit" className="hover:text-red-500 transition">{t("Audit")}</Link>
        <Link to="/privacy-policy" className="hover:text-red-500 transition">{t("Privacy")}</Link>
      </nav>

      {/* Info */}
      <div className="text-right text-[9px] md:text-xs text-gray-400 font-mono leading-tight flex flex-col md:items-end">
        <span className="drop-shadow-sm">{t("Time")}: {currentTime}</span>
        <span className="text-red-500 drop-shadow-sm">{t("Launch In")}: {countdown}</span>
        <span className="text-yellow-400 drop-shadow-sm max-w-[180px] md:max-w-none">
          ⚠️ {t("Presale ends once purchase goal is reached.")}
        </span>
        {/* LanguageSwitcher removed */}
      </div>
    </header>
  );
};

export default Navbar;
