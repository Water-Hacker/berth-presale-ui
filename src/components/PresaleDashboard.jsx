/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useAccount, useDisconnect, useWalletClient } from "wagmi";
import { Web3Button } from "@web3modal/react";
import { Contract, parseEther, formatUnits, ethers } from "ethers";
import axios from "axios";

import { berthABI, berthAddress } from "../contracts/BerthTokenABI";
import berthPresaleABI, { berthPresaleAddress } from "../contracts/BerthPresaleABI";

import ProgressTube from "../components/ProgressTube";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import Banner from "../assets/banner-image.svg";

const PresaleDashboard = () => {
  const [amount, setAmount] = useState(0);
  const [purchaseAmount, setPurchaseAmount] = useState("");
  const [estimatedTokens, setEstimatedTokens] = useState("0");
  const [error, setError] = useState("");
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

  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { disconnect } = useDisconnect();

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
      alert(`✅ Successfully purchased BERTH tokens with ${ethAmount} ETH`);
      setError("");
      setPurchaseAmount("");
      await fetchUserBalance();
      await fetchAllocation();
      await fetchBackendPresaleAmount();
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
      <motion.div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white flex flex-col items-center px-4 py-6 gap-10" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, ease: "easeOut" }}>
        <h1 className="text-4xl md:text-5xl font-extrabold text-center drop-shadow-[0_0_15px_#ff0000aa]">
          BERTH Token Presale
        </h1>

        <div className="w-full max-w-5xl">
          <img src={Banner} alt="BERTH Banner" className="w-full rounded-xl shadow-xl" />
        </div>

        {loading && <p className="text-center text-yellow-300">Loading presale amount...</p>}
        {error && <p className="text-center text-red-500 font-mono">{error}</p>}

        <ProgressTube amount={amount} />

        <div className="flex flex-col items-center gap-4 w-full max-w-md bg-gradient-to-br from-gray-900 to-black p-8 rounded-3xl shadow-[0_0_30px_rgba(255,0,0,0.8)]">
          <Web3Button />
          {isConnected && (
            <>
              <p className="text-green-400 font-mono break-all text-center">Connected: {address}</p>
              <p className="text-green-400 font-mono text-center">ETH Balance: {parseFloat(ethBalance).toFixed(4)}</p>
              <p className="text-green-400 font-mono text-center">BERTH Token Balance: {userTokenBalance}</p>
              <p className="text-yellow-400 font-mono text-center">Allocated (Unclaimed): {allocatedTokens} BERTH</p>
              {ethPriceUSD && <p className="text-blue-400 font-mono text-center">Live ETH Price: ${ethPriceUSD}</p>}
              <button onClick={disconnect} className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-md text-sm">Disconnect Wallet</button>
            </>
          )}
          <input type="number" placeholder="Enter ETH amount" value={purchaseAmount} onChange={(e) => setPurchaseAmount(e.target.value)} className="w-full rounded-lg px-4 py-3 bg-gray-800 text-white border border-red-600 focus:outline-none focus:ring-2 focus:ring-red-500" min="0.0025" step="any" />
          {purchaseAmount && <p className="text-sm text-gray-400">≈ {estimatedTokens} BERTH</p>}
          <button onClick={handlePurchase} disabled={loading || isPurchaseDisabled} className={`bg-red-600 hover:bg-red-700 px-6 py-3 rounded-full text-lg font-semibold w-full ${loading || isPurchaseDisabled ? "opacity-50 cursor-not-allowed" : ""}`}>
            {loading ? "Processing..." : "Purchase Tokens"}
          </button>
        </div>

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

          <p className="text-center text-lg text-yellow-300 mt-4">🌍 Switch to PC to join the BERTH presale now.<br />🪙 Be early. Be real. Be ready for the future of Earth — reimagined.See you in BlockEarth 2.0</p>

          <p className="text-right text-sm text-gray-500 mt-4">— The Block Earth Team</p>
        </div>

        <Footer />
      </motion.div>
    </>
  );
};

export default PresaleDashboard;
