import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Logo from "../assets/logo.svg";
import LanguageSwitcher from "./LanguageSwitcher";
import { useTranslation } from "react-i18next";

const LAUNCH_DATE = new Date("2026-07-06T00:00:00Z");

const Navbar = () => {
  const [currentTime, setCurrentTime] = useState("");
  const [countdown, setCountdown] = useState("");
  const { t } = useTranslation();

  useEffect(() => {
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

      const diff = LAUNCH_DATE - now;
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
    <header className="bg-black bg-opacity-80 shadow-2xl px-4 py-3 md:px-6 md:py-4 flex flex-col md:flex-row md:justify-between md:items-center gap-4 md:gap-0 border-b border-red-600 backdrop-blur-md">
      
      {/* Logo & Title */}
      <div className="flex items-center gap-3">
        <img
          src={Logo}
          alt="BERTH Logo"
          className="h-8 w-8 md:h-10 md:w-auto drop-shadow-[0_0_5px_red]"
        />
        <h2 className="text-white font-bold text-lg md:text-xl drop-shadow-[0_0_8px_red]">
          BERTH
        </h2>
      </div>

      {/* Navigation Links */}
      <nav className="flex flex-wrap justify-center gap-3 md:gap-6 text-white text-xs md:text-sm font-semibold">
        <Link to="/" className="hover:text-red-500 transition">{t("Dashboard")}</Link>
        <Link to="/whitelist" className="hover:text-red-500 transition">{t("Tokenomics")}</Link>
        <Link to="/roadmap" className="hover:text-red-500 transition">{t("Roadmap")}</Link>
        <Link to="/audit" className="hover:text-red-500 transition">{t("Audit")}</Link>
        <Link to="/privacy-policy" className="hover:text-red-500 transition">{t("Privacy")}</Link>
      </nav>

      {/* Info & Language */}
      <div className="text-right text-[10px] md:text-xs text-gray-400 font-mono leading-tight flex flex-col md:items-end">
        <span className="drop-shadow-sm">{t("Time")}: {currentTime}</span>
        <span className="text-red-500 drop-shadow-sm">{t("Launch In")}: {countdown}</span>
        <span className="text-yellow-400 drop-shadow-sm max-w-[200px] md:max-w-none">
          ⚠️ {t("+5% in price weekly. Presale ends once purchase goal is reached.")}
        </span>
        <div className="mt-1 md:mt-0">
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
};

export default Navbar;
