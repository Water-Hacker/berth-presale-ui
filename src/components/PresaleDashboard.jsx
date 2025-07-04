import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useAccount, useDisconnect, useWalletClient } from "wagmi";
import { Web3Button } from "@web3modal/react";
import { Contract, parseEther, formatUnits, ethers } from "ethers";
import axios from "axios";

import { berthABI, berthAddress } from "../contracts/BerthTokenABI";
import berthPresaleABI, { berthPresaleAddress } from "../contracts/BerthPresaleABI";

import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import Banner from "../assets/banner-image.svg";

const PresaleDashboard = () => {
  const [purchaseAmount, setPurchaseAmount] = useState("");
  const [estimatedTokens, setEstimatedTokens] = useState("0");
  const [loading, setLoading] = useState(false);
  const [presaleContract, setPresaleContract] = useState(null);
  const [tokenContract, setTokenContract] = useState(null);
  const [userTokenBalance, setUserTokenBalance] = useState("0");
  const [allocatedTokens, setAllocatedTokens] = useState("0");
  const [ethBalance, setEthBalance] = useState("0");
  const [ethToBerthRate, setEthToBerthRate] = useState(40);
  const [ethPriceUSD, setEthPriceUSD] = useState(null);
  const [signer, setSigner] = useState(null);
  const [isPurchaseDisabled, setIsPurchaseDisabled] = useState(false);
  const [error, setError] = useState("");

  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { disconnect } = useDisconnect();

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
    const fetchLiveEthPrice = async () => {
      try {
        const res = await axios.get(
          "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd"
        );
        setEthPriceUSD(res.data.ethereum.usd);
        setEthToBerthRate(40);
      } catch (err) {
        console.error("Failed to fetch ETH price:", err);
      }
    };
    fetchLiveEthPrice();
    const interval = setInterval(fetchLiveEthPrice, 60000);
    return () => clearInterval(interval);
  }, []);

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

  useEffect(() => {
    if (purchaseAmount && !isNaN(parseFloat(purchaseAmount))) {
      const ethAmount = parseFloat(purchaseAmount);
      const tokens = ethAmount * ethToBerthRate;
      const currentHoldings = parseFloat(userTokenBalance || "0");
      const unclaimed = parseFloat(allocatedTokens || "0");
      const totalAfterPurchase = currentHoldings + unclaimed + tokens;

      setEstimatedTokens(tokens.toFixed(4));

      if (totalAfterPurchase > 1000) {
        setIsPurchaseDisabled(true);
        setError("You cannot hold more than 1000 BERTH tokens.");
      } else {
        setIsPurchaseDisabled(false);
        setError("");
      }
    } else {
      setEstimatedTokens("0");
      setIsPurchaseDisabled(false);
      setError("");
    }
  }, [purchaseAmount, userTokenBalance, allocatedTokens, ethToBerthRate]);

  const handlePurchase = async () => {
    if (!isConnected || !signer || !presaleContract) {
      setError("Please connect your wallet first.");
      return;
    }

    const ethAmount = parseFloat(purchaseAmount);
    if (isNaN(ethAmount) || ethAmount <= 0) {
      setError("Enter a valid ETH amount.");
      return;
    }

    if (parseFloat(ethBalance) < ethAmount) {
      setError("Insufficient ETH balance for this purchase.");
      return;
    }

    try {
      setLoading(true);
      const tx = await presaleContract.buyTokens({
        value: parseEther(ethAmount.toString()),
      });
      await tx.wait();
      alert(`\u2705 Successfully purchased BERTH tokens with ${ethAmount} ETH`);
      setError("");
      setPurchaseAmount("");
      await fetchUserBalance();
      await fetchAllocation();
      setEstimatedTokens("0");
      setIsPurchaseDisabled(false);
    } catch (err) {
      console.error("Transaction error:", err);
      setError("Transaction failed: " + (err?.reason || err?.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <motion.div
        className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white flex flex-col items-center px-4 py-6 gap-10"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <div className="w-full max-w-4xl bg-gray-900 text-white p-6 rounded-2xl shadow-lg space-y-6 text-sm leading-6">
          <h2 className="text-2xl md:text-3xl font-bold text-red-400">Welcome to Block Earth 2.0</h2>
          <p>The world’s first hyper-realistic, AI-powered digital twin of our planet.</p>
          <p className="italic">This isn’t just a token launch — it’s the beginning of a new digital civilization. And to ensure the integrity, security, and performance of this foundational phase, the BERTH presale is exclusively available on PC.</p>

          <hr className="border-gray-700" />

          <h3 className="text-xl font-semibold text-red-300">🖥️ Built for Power — Not Phones</h3>
          <ul className="list-disc ml-6 space-y-2">
            <li>Early access tools — like land claiming, simulation control, and DAO voting — require powerful, stable PC environments</li>
            <li>Our smart contracts and presale dashboard are optimized for secure desktop execution</li>
            <li>The full Block Earth client (post-launch) is a photorealistic experience best suited for PC, console, or VR</li>
          </ul>

          <hr className="border-gray-700" />

          <h3 className="text-xl font-semibold text-red-300">📱 What About Mobile?</h3>
          <p>Yes — we will support mobile. But only after the presale, and only for lightweight activities, such as:</p>
          <ul className="list-disc ml-6 space-y-1">
            <li>Monitoring your BERTH balance</li>
            <li>Voting on proposals</li>
            <li>Booking travel in-world</li>
            <li>Viewing land stats and events</li>
          </ul>

          <p className="italic">Mobile will be your dashboard — not your cockpit. The full-scale Block Earth experience will always require a PC or immersive device.</p>

          <hr className="border-gray-700" />

          <h3 className="text-xl font-semibold text-red-300">🎯 A Strategic Decision for a Real Future</h3>
          <p>This isn’t about limiting access — it’s about preserving quality.<br />
          We’re building a real economy, a real society, and a real digital world — not a hype-driven quick flip.<br />
          Limiting the presale to desktop ensures that early participants are builders, pioneers, and stakeholders in something long-term.</p>

          <p className="font-bold text-green-400">You’re not just buying a token. You’re claiming your place in history.</p>

          <p className="text-center text-lg text-yellow-300">🌍 Switch to PC to join the BERTH presale now.<br />
          🪙 Be early. Be real. Be ready for the future of Earth — reimagined. See you in BlockEarth</p>

          <p className="text-right text-sm text-gray-500">— The Block Earth Team</p>
        </div>

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
        <Footer />
      </motion.div>
    </>
  );
};

export default PresaleDashboard;
