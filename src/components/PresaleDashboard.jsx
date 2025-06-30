import React, { useState, useEffect } from "react";
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
import { useNavigate } from "react-router-dom";

const PresaleDashboard = () => {
  const [amount, setAmount] = useState(295965061);
  const [purchaseAmount, setPurchaseAmount] = useState("");
  const [estimatedTokens, setEstimatedTokens] = useState("0");
  const [error, setError] = useState("");
  const [presaleContract, setPresaleContract] = useState(null);
  const [tokenContract, setTokenContract] = useState(null);
  const [userTokenBalance, setUserTokenBalance] = useState("0");
  const [allocatedTokens, setAllocatedTokens] = useState("0");
  const [ethBalance, setEthBalance] = useState("0");
  const [ethToBerthRate, setEthToBerthRate] = useState(40);
  const [ethPriceUSD, setEthPriceUSD] = useState(null);
  const [signer, setSigner] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isPurchaseDisabled, setIsPurchaseDisabled] = useState(false);

  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { disconnect } = useDisconnect();
  const navigate = useNavigate();

  const addOrSwitchToMainnet = async () => {
    if (!window.ethereum) {
      alert("MetaMask is not installed");
      return false;
    }
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x1" }], // Ethereum Mainnet
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
          alert("Failed to add Ethereum Mainnet to MetaMask");
        }
      } else {
        alert("Failed to switch to Ethereum Mainnet");
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
        const ethUsd = res.data.ethereum.usd;
        setEthPriceUSD(ethUsd);
        setEthToBerthRate(40);
      } catch (err) {
        console.error("Failed to fetch ETH price:", err);
        setEthPriceUSD(null);
        setEthToBerthRate(40);
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
        setError("Please switch to Ethereum Mainnet.");
        return;
      }

      if (walletClient && window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signerInstance = await provider.getSigner();
        setSigner(signerInstance);
        const balance = await provider.getBalance(signerInstance.address);
        setEthBalance(formatUnits(balance, 18));
      }
    };
    prepare();
  }, [walletClient]);

  useEffect(() => {
    if (signer) {
      const presale = new Contract(berthPresaleAddress, berthPresaleABI, signer);
      setPresaleContract(presale);
      const token = new Contract(berthAddress, berthABI, signer);
      setTokenContract(token);
    }
  }, [signer]);

  useEffect(() => {
    const interval = setInterval(() => {
      const increment = Math.floor(Math.random() * (30000 - 20000 + 1)) + 20000;
      setAmount((prev) => Math.min(prev + increment, 470000000));
    }, 3600000);
    return () => clearInterval(interval);
  }, []);

  const fetchUserBalance = async () => {
    if (tokenContract && address) {
      try {
        const balance = await tokenContract.balanceOf(address);
        setUserTokenBalance(formatUnits(balance, 18));
      } catch (err) {
        console.error("Failed to fetch balance:", err);
      }
    }
  };

  const fetchAllocation = async () => {
    if (presaleContract && address) {
      try {
        const allocated = await presaleContract.getAllocation(address);
        setAllocatedTokens(formatUnits(allocated, 18));
      } catch (err) {
        console.error("Failed to fetch allocation:", err);
      }
    }
  };

  useEffect(() => {
    if (isConnected) {
      fetchUserBalance();
      fetchAllocation();
    } else {
      setUserTokenBalance("0");
      setAllocatedTokens("0");
    }
  }, [isConnected, tokenContract, presaleContract, address]);

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
      <motion.div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white flex flex-col items-center px-4 py-6 gap-10"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <h1 className="text-4xl md:text-5xl font-extrabold text-center drop-shadow-[0_0_15px_#ff0000aa]">
          BERTH Token Presale Dashboard
        </h1>

        <div className="w-full max-w-5xl">
          <img src={Banner} alt="BERTH Banner" className="w-full rounded-xl shadow-xl" />
        </div>

        <ProgressTube amount={amount} />

        <div className="flex flex-col items-center gap-4 w-full max-w-md bg-gradient-to-br from-gray-900 to-black p-8 rounded-3xl shadow-[0_0_30px_rgba(255,0,0,0.8)]">
          <Web3Button />
          {isConnected && (
            <>
              <p className="text-green-400 font-mono break-all text-center">
                Connected: {address}
              </p>
              <p className="text-green-400 font-mono text-center">
                ETH Balance: {parseFloat(ethBalance).toFixed(4)}
              </p>
              <p className="text-green-400 font-mono text-center">
                BERTH Token Balance: {userTokenBalance}
              </p>
              <p className="text-yellow-400 font-mono text-center">
                Allocated (Unclaimed): {allocatedTokens} BERTH
              </p>
              {ethPriceUSD && (
                <p className="text-blue-400 font-mono text-center">
                  Live ETH Price: ${ethPriceUSD}
                </p>
              )}
              <button onClick={disconnect}
                className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-md text-sm">
                Disconnect Wallet
              </button>
            </>
          )}

          <input
            type="number"
            placeholder="Enter ETH amount"
            value={purchaseAmount}
            onChange={(e) => setPurchaseAmount(e.target.value)}
            className="w-full rounded-lg px-4 py-3 bg-gray-800 text-white border border-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
            min="0.0025"
            step="any"
          />

          {purchaseAmount && (
            <p className="text-sm text-gray-400">≈ {estimatedTokens} BERTH</p>
          )}

          <button
            onClick={handlePurchase}
            disabled={loading || isPurchaseDisabled}
            className={`bg-red-600 hover:bg-red-700 px-6 py-3 rounded-full text-lg font-semibold w-full ${
              loading || isPurchaseDisabled ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {loading ? "Processing..." : "Purchase Tokens"}
          </button>

          {error && <p className="text-red-500 mt-2 font-mono text-center">{error}</p>}
        </div>

        <Footer />
      </motion.div>
    </>
  );
};

export default PresaleDashboard;
