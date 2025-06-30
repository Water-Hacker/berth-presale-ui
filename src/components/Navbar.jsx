import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Logo from "../assets/logo.svg";
import LanguageSwitcher from "./LanguageSwitcher";
import { useTranslation } from "react-i18next";

// Define launch date outside the component to avoid unnecessary re-renders
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

    updateTime(); // Initial call
    const interval = setInterval(updateTime, 1000); // Update every second

    return () => clearInterval(interval);
  }, []); // No dependencies needed since LAUNCH_DATE is outside component

  return (
    <header className="bg-black bg-opacity-80 shadow-2xl p-4 px-6 flex flex-col md:flex-row md:justify-between md:items-center backdrop-blur-md border-b border-red-600">
      <div className="flex items-center gap-4 mb-2 md:mb-0">
        <img
          src={Logo}
          alt="BERTH Logo"
          className="h-10 w-auto drop-shadow-[0_0_5px_red]"
        />
        <h2 className="text-white font-bold text-xl drop-shadow-[0_0_8px_red]">
          BERTH
        </h2>
      </div>

      <nav className="flex flex-wrap items-center gap-6 text-white font-semibold text-sm md:text-base">
        <Link to="/" className="hover:text-red-500 transition">{t("Dashboard")}</Link>
        <Link to="/whitelist" className="hover:text-red-500 transition">{t("Tokenomics")}</Link>
        <Link to="/roadmap" className="hover:text-red-500 transition">{t("Roadmap")}</Link>
        <Link to="/audit" className="hover:text-red-500 transition">{t("Audit")}</Link>
        <Link to="/privacy-policy" className="hover:text-red-500 transition">{t("Privacy")}</Link>
      </nav>

      <div className="flex flex-col md:flex-row items-end md:items-center gap-3 mt-3 md:mt-0 text-xs font-mono text-gray-400 text-right">
        <div className="flex flex-col md:items-end">
          <span className="drop-shadow-sm">{t("Time")}: {currentTime}</span>
          <span className="text-red-500 drop-shadow-sm">{t("Launch In")}: {countdown}</span>
          <span className="text-yellow-400 drop-shadow-sm">⚠️ Token Price grows 5% Weekly. Presale ends once funding goal is reached.</span>
        </div>
        <LanguageSwitcher />
      </div>
    </header>
  );
};

export default Navbar;
