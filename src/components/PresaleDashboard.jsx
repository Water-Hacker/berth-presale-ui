import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useAccount, useDisconnect, useBalance, useContractRead } from "wagmi";
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
  const [allocatedTokens, setAllocatedTokens] = useState("0");
  const [ethToBerthRate, setEthToBerthRate] = useState(40);
  const [ethPriceUSD, setEthPriceUSD] = useState(null);
  const [isPurchaseDisabled, setIsPurchaseDisabled] = useState(false);

  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();

  // Wagmi hook: get ETH balance
  const {
    data: ethBalanceData,
    isLoading: ethBalanceLoading,
    isError: ethBalanceError,
  } = useBalance({
    address,
    watch: true,
    enabled: isConnected && !!address,
  });

  // Wagmi hook: get BERTH token balance
  const {
    data: userTokenBalanceData,
    isLoading: userTokenBalanceLoading,
    isError: userTokenBalanceError,
  } = useContractRead({
    address: berthAddress,
    abi: berthABI,
    functionName: "balanceOf",
    args: [address],
    watch: true,
    enabled: isConnected && !!address,
  });

  // Fetch presale amount from backend with loading and error handling
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

  // Poll presale amount every 1 minute
  useEffect(() => {
    fetchBackendPresaleAmount(); // Initial fetch
    const interval = setInterval(() => {
      fetchBackendPresaleAmount();
    }, 60 * 1000); // every 1 minute

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
        setError("Please switch to Ethereum Mainnet.");
        return;
      }
    };
    prepare();
  }, []);

  // Setup presale and token contracts with signer
  useEffect(() => {
    const setupContracts = async () => {
      if (isConnected && window.ethereum && address) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();
          const presale = new Contract(berthPresaleAddress, berthPresaleABI, signer);
          setPresaleContract(presale);
        } catch (err) {
          console.error("Failed to set up contracts:", err);
          setError("Failed to initialize contracts.");
        }
      } else {
        setPresaleContract(null);
      }
    };
    setupContracts();
  }, [isConnected, address]);

  // Fetch user allocation
  const fetchAllocation = useCallback(async () => {
    if (presaleContract && address) {
      try {
        const allocated = await presaleContract.getAllocation(address);
        setAllocatedTokens(formatUnits(allocated, 18));
      } catch (err) {
        console.error("Failed to fetch allocation:", err);
        setError("Failed to fetch allocation.");
      }
    } else {
      setAllocatedTokens("0");
    }
  }, [presaleContract, address]);

  useEffect(() => {
    if (isConnected) {
      fetchAllocation();
    } else {
      setAllocatedTokens("0");
    }
  }, [isConnected, fetchAllocation]);

  // Update token balances from Wagmi hook data
  useEffect(() => {
    if (userTokenBalanceData) {
      setUserTokenBalance(formatUnits(userTokenBalanceData, 18));
    } else {
      setUserTokenBalance("0");
    }
  }, [userTokenBalanceData]);

  // Update ETH balance from Wagmi hook data
  useEffect(() => {
    if (ethBalanceData) {
      setEthBalance(ethBalanceData.formatted);
    } else {
      setEthBalance("0");
    }
  }, [ethBalanceData]);

  // Fetch ETH price in USD every minute
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

  // Calculate estimated tokens & disable purchase if limit exceeded
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
    if (!isConnected || !presaleContract) {
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
      await fetchBackendPresaleAmount();
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

  // local states to keep string for balances shown on UI
  const [userTokenBalance, setUserTokenBalance] = useState("0");
  const [ethBalance, setEthBalance] = useState("0");

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

        <div className="flex flex-col items-center gap-4 w-full max-w-md bg-gradient-to-br from-gray-900 to-black p-8 rounded-3xl shadow-[0_0_30px_rgba(255,0,0,0.8)]">
          <Web3Button />
          {isConnected && (
            <>
              <p className="text-green-400 font-mono break-all text-center">Connected: {address}</p>
              <p className="text-green-400 font-mono text-center">
                ETH Balance: {parseFloat(ethBalance).toFixed(4)}
              </p>
              <p className="text-green-400 font-mono text-center">BERTH Token Balance: {userTokenBalance}</p>
              <p className="text-yellow-400 font-mono text-center">
                Allocated (Unclaimed): {allocatedTokens} BERTH
              </p>
              {ethPriceUSD && (
                <p className="text-blue-400 font-mono text-center">Live ETH Price: ${ethPriceUSD}</p>
              )}
              <button
                onClick={disconnect}
                className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-md text-sm"
              >
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
        </div>

        <Footer />
      </motion.div>
    </>
  );
};

export default PresaleDashboard;
