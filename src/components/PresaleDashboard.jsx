import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useAccount, useWalletClient } from "wagmi";
import { Contract, formatUnits, ethers } from "ethers";
import axios from "axios";

import { berthABI, berthAddress } from "../contracts/BerthTokenABI";
import berthPresaleABI, { berthPresaleAddress } from "../contracts/BerthPresaleABI";

import ProgressTube from "../components/ProgressTube";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import Banner from "../assets/banner-image.svg";

const PresaleDashboard = () => {
  const [amount, setAmount] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [presaleContract, setPresaleContract] = useState(null);
  const [tokenContract, setTokenContract] = useState(null);
  const [userTokenBalance, setUserTokenBalance] = useState("0");
  const [allocatedTokens, setAllocatedTokens] = useState("0");
  const [ethBalance, setEthBalance] = useState("0");
  const [signer, setSigner] = useState(null);

  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();

  const fetchBackendPresaleAmount = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get("https://berth-backend.onrender.com/api/presale-amount");
      setAmount(res.data.amount);
    } catch (err) {
      console.error("Failed to fetch presale amount:", err);
      setError("Failed to fetch presale amount from server.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBackendPresaleAmount();
    const interval = setInterval(() => {
      fetchBackendPresaleAmount();
    }, 60000);
    return () => clearInterval(interval);
  }, [fetchBackendPresaleAmount]);

  const addOrSwitchToMainnet = async () => {
    if (!window.ethereum) return false;
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x1" }],
      });
      return true;
    } catch (switchError) {
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: "0x1",
                chainName: "Ethereum Mainnet",
                rpcUrls: [process.env.NEXT_PUBLIC_RPC_URL],
                nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
                blockExplorerUrls: ["https://etherscan.io"],
              },
            ],
          });
          return true;
        } catch {
          return false;
        }
      }
      return false;
    }
  };

  useEffect(() => {
    const prepare = async () => {
      const switched = await addOrSwitchToMainnet();
      if (!switched) {
        setError("Ethereum Mainnet Only.");
        return;
      }
      if (walletClient && window.ethereum) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const signerInstance = await provider.getSigner();
          setSigner(signerInstance);
          const balance = await provider.getBalance(signerInstance.address);
          setEthBalance(formatUnits(balance, 18));
        } catch (err) {
          console.error("Failed to prepare signer and balance:", err);
          setError("Failed to get wallet signer or balance.");
        }
      }
    };
    prepare();
  }, [walletClient]);

  useEffect(() => {
    if (signer) {
      const presale = new Contract(berthPresaleAddress, berthPresaleABI, signer);
      const token = new Contract(berthAddress, berthABI, signer);
      setPresaleContract(presale);
      setTokenContract(token);
    }
  }, [signer]);

  const fetchUserBalance = useCallback(async () => {
    if (tokenContract && address) {
      try {
        const balance = await tokenContract.balanceOf(address);
        setUserTokenBalance(formatUnits(balance, 18));
      } catch (err) {
        console.error("Failed to fetch balance:", err);
        setError("Failed to fetch token balance.");
      }
    }
  }, [tokenContract, address]);

  const fetchAllocation = useCallback(async () => {
    if (presaleContract && address) {
      try {
        const allocated = await presaleContract.getAllocation(address);
        setAllocatedTokens(formatUnits(allocated, 18));
      } catch (err) {
        console.error("Failed to fetch allocation:", err);
        setError(".");
      }
    }
  }, [presaleContract, address]);

  useEffect(() => {
    if (isConnected) {
      fetchUserBalance();
      fetchAllocation();
    } else {
      setUserTokenBalance("0");
      setAllocatedTokens("0");
    }
  }, [isConnected, fetchUserBalance, fetchAllocation]);

  return (
    <>
      <Navbar />
      <motion.div
        className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white flex flex-col items-center px-4 py-6 gap-10"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <h1 className="text-4xl md:text-5xl font-extrabold text-center drop-shadow-[0_0_15px_#ff0000aa]">
          BERTH Token Presale
        </h1>

        <div className="w-full max-w-5xl">
          <img src={Banner} alt="BERTH Banner" className="w-full rounded-xl shadow-xl" />
        </div>

        {loading && <p className="text-center text-yellow-300">Loading presale amount...</p>}
        {error && <p className="text-center text-red-500 font-mono">{error}</p>}

        <ProgressTube amount={amount} />

        {/* Block Earth 2.0 Announcement */}
        <div className="prose prose-invert max-w-3xl text-sm bg-gray-900/80 rounded-2xl p-6 text-white shadow-md">
          <h2 className="text-xl font-bold text-red-400">Welcome to Block Earth 2.0</h2>
          <p>The world’s first hyper-realistic, AI-powered digital twin of our planet.</p>
          <p>This isn’t just a token launch — it’s the beginning of a new digital civilization. And to ensure the integrity, security, and performance of this foundational phase, the BERTH presale is exclusively available on PC.</p>

          <hr className="border-gray-700 my-4" />

          <h3 className="text-lg font-semibold text-red-300">🖥️ Built for Power — Not Phones</h3>
          <ul className="list-disc pl-6">
            <li>Early access tools — like land claiming, simulation control, and DAO voting — require powerful, stable PC environments</li>
            <li>Our smart contracts and presale dashboard are optimized for secure desktop execution</li>
            <li>The full Block Earth client (post-launch) is a photorealistic experience best suited for PC, console, or VR</li>
          </ul>

          <hr className="border-gray-700 my-4" />

          <h3 className="text-lg font-semibold text-red-300">📱 What About Mobile?</h3>
          <p>Yes — we will support mobile. But only after the presale, and only for lightweight activities, such as:</p>
          <ul className="list-disc pl-6">
            <li>Monitoring your BERTH balance</li>
            <li>Voting on proposals</li>
            <li>Booking travel in-world</li>
            <li>Viewing land stats and events</li>
          </ul>
          <p className="italic">Mobile will be your dashboard — not your cockpit. The full-scale Block Earth experience will always require a PC or immersive device.</p>

          <hr className="border-gray-700 my-4" />

          <h3 className="text-lg font-semibold text-red-300">🎯 A Strategic Decision for a Real Future</h3>
          <p>This isn’t about limiting access — it’s about preserving quality. We’re building a real economy, a real society, and a real digital world — not a hype-driven quick flip. Limiting the presale to desktop ensures that early participants are builders, pioneers, and stakeholders in something long-term.</p>

          <p className="font-bold text-green-400">You’re not just buying a token. You’re claiming your place in history.</p>

          <p className="text-center text-lg text-yellow-300 mt-4">🌍 Switch to PC to join the BERTH presale now.<br />🪙 Be early. Be real. Be ready for the future of Earth — reimagined.</p>

          <p className="text-right text-sm text-gray-500 mt-4">See You in BlockEarth 2.0<br />— The Block Earth Team</p>
        </div>

        <Footer />
      </motion.div>
    </>
  );
};

export default PresaleDashboard;
