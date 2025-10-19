/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  useAccount,
  useDisconnect,
  useWalletClient,
  useConnect,
  useChainId,
  useSwitchChain,
  useBalance,
  usePublicClient,
} from "wagmi";
import { parseEther, formatUnits } from "viem";
import { BrowserProvider, Contract } from "ethers";
import axios from "axios";
import toast from "react-hot-toast";

import { berthABI, berthAddress } from "../contracts/BerthTokenABI";
import berthPresaleABI, {
  berthPresaleAddress,
} from "../contracts/BerthPresaleABI";

import ProgressTube from "../components/ProgressTube";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import Banner from "../assets/banner-image.svg";

const PresaleDashboard = () => {
  // -------------------- STATE --------------------
  const [amount, setAmount] = useState(0);
  const [purchaseAmount, setPurchaseAmount] = useState("");
  const [estimatedTokens, setEstimatedTokens] = useState("0");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [presaleContract, setPresaleContract] = useState(null);
  const [tokenContract, setTokenContract] = useState(null);
  const [userTokenBalance, setUserTokenBalance] = useState("0");
  const [allocatedTokens, setAllocatedTokens] = useState("0");
  const [ethToBerthRate, setEthToBerthRate] = useState(40);
  const [ethPriceUSD, setEthPriceUSD] = useState(null);
  const [signer, setSigner] = useState(null);
  const [isPurchaseDisabled, setIsPurchaseDisabled] = useState(false);
  const [minPurchaseEth, setMinPurchaseEth] = useState(null);
  const [maxTokensPerAddress, setMaxTokensPerAddress] = useState(null);
  const [fundsWallet, setFundsWallet] = useState(null);
  const [txHash, setTxHash] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // -------------------- WAGMI v2 HOOKS --------------------
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { disconnect } = useDisconnect();
  const { connect, connectors, isPending: isConnecting } = useConnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const publicClient = usePublicClient();
  
  // ✅ NEW: Use wagmi's useBalance hook for better performance
  const { data: balanceData, refetch: refetchBalance } = useBalance({
    address: address,
    watch: true, // Auto-update balance
  });

  // ✅ NEW: Computed values with useMemo
  const isOnMainnet = useMemo(() => chainId === 1, [chainId]);
  const ethBalance = useMemo(() => 
    balanceData ? formatUnits(balanceData.value, 18) : "0",
    [balanceData]
  );

  // ✅ NEW: Input validation
  const purchaseValidation = useMemo(() => {
    if (!purchaseAmount) return { isValid: false, message: "" };
    
    const amount = parseFloat(purchaseAmount);
    if (isNaN(amount) || amount <= 0) {
      return { isValid: false, message: "Enter a valid amount" };
    }
    
    if (minPurchaseEth && amount < minPurchaseEth) {
      return { isValid: false, message: `Minimum purchase: ${minPurchaseEth} ETH` };
    }
    
    if (parseFloat(ethBalance) < amount) {
      return { isValid: false, message: "Insufficient balance" };
    }
    
    const tokensToReceive = amount * ethToBerthRate;
    const currentAllocation = parseFloat(allocatedTokens);
    if (maxTokensPerAddress && (currentAllocation + tokensToReceive) > maxTokensPerAddress) {
      return { 
        isValid: false, 
        message: `Would exceed max allocation of ${maxTokensPerAddress} BERTH` 
      };
    }
    
    return { isValid: true, message: "" };
  }, [purchaseAmount, minPurchaseEth, ethBalance, ethToBerthRate, allocatedTokens, maxTokensPerAddress]);

  // -------------------- BACKEND PRESALE --------------------
  const fetchBackendPresaleAmount = useCallback(async () => {
    try {
      const res = await axios.get(
        "https://berth-backend.onrender.com/api/presale-amount",
        { timeout: 10000 }
      );
      setAmount(res.data.amount);
    } catch (err) {
      console.error("❌ Failed to fetch presale amount:", err);
      if (!amount) { // Only show error if we don't have cached data
        toast.error("Could not fetch presale data");
      }
    }
  }, [amount]);

  useEffect(() => {
    fetchBackendPresaleAmount();
    const interval = setInterval(fetchBackendPresaleAmount, 60000);
    return () => clearInterval(interval);
  }, [fetchBackendPresaleAmount]);

  // -------------------- ETH PRICE --------------------
  useEffect(() => {
    const fetchLiveEthPrice = async () => {
      try {
        const res = await axios.get(
          "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd",
          { timeout: 5000 }
        );
        setEthPriceUSD(res.data.ethereum.usd);
      } catch (err) {
        console.error("Failed to fetch ETH price:", err);
      }
    };
    fetchLiveEthPrice();
    const interval = setInterval(fetchLiveEthPrice, 60000);
    return () => clearInterval(interval);
  }, []);

  // -------------------- MAINNET HANDLER --------------------
  const ensureMainnet = useCallback(async () => {
    const MAINNET_CHAIN_ID = 1;
    
    if (chainId !== MAINNET_CHAIN_ID) {
      try {
        if (switchChain) {
          await switchChain({ chainId: MAINNET_CHAIN_ID });
          toast.success("Switched to Ethereum Mainnet");
        } else if (window.ethereum) {
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: "0x1" }],
          });
          toast.success("Switched to Ethereum Mainnet");
        }
      } catch (e) {
        console.warn("⚠️ Mainnet switch failed", e);
        toast.error("Please switch to Ethereum Mainnet manually");
      }
    }
  }, [chainId, switchChain]);

  // -------------------- SIGNER + PROVIDER --------------------
  useEffect(() => {
    const prepare = async () => {
      try {
        let provider;
        
        if (walletClient) {
          const eip1193 = {
            request: async (args) => {
              try {
                return await walletClient.request(args);
              } catch (error) {
                throw error;
              }
            },
          };
          provider = new BrowserProvider(eip1193);
        } else if (window.ethereum) {
          provider = new BrowserProvider(window.ethereum);
          await ensureMainnet();
        } else {
          setError("No wallet found. Please connect your wallet.");
          return;
        }

        const network = await provider.getNetwork();
        
        if (network.chainId !== 1n) {
          setError("⚠️ Please switch to Ethereum Mainnet");
          await ensureMainnet();
        } else {
          setError("");
        }

        const signerInstance = await provider.getSigner();
        setSigner(signerInstance);
      } catch (err) {
        console.error("Signer setup failed:", err);
        setError("Could not connect to wallet. Please try again.");
        toast.error("Wallet connection failed");
      }
    };
    
    if (isConnected) {
      prepare();
    } else {
      setSigner(null);
      setPresaleContract(null);
      setTokenContract(null);
    }
  }, [walletClient, chainId, isConnected, ensureMainnet]);

  // -------------------- CONTRACTS --------------------
  useEffect(() => {
    if (signer && isOnMainnet) {
      try {
        setPresaleContract(
          new Contract(berthPresaleAddress, berthPresaleABI, signer)
        );
        setTokenContract(new Contract(berthAddress, berthABI, signer));
      } catch (err) {
        console.error("Contract initialization failed:", err);
        toast.error("Failed to initialize contracts");
      }
    }
  }, [signer, isOnMainnet]);

  // -------------------- CONTRACT PARAMS --------------------
  useEffect(() => {
    const loadParams = async () => {
      if (!presaleContract) return;
      try {
        const [minPurchase, maxPerAddr, funds, rate] = await Promise.all([
          presaleContract.MIN_PURCHASE?.().catch(() => null),
          presaleContract.MAX_TOKENS_PER_ADDRESS?.().catch(() => null),
          presaleContract.fundsWallet?.().catch(() => null),
          presaleContract.ethToBerthRate?.().catch(() => null),
        ]);
        
        if (minPurchase) setMinPurchaseEth(parseFloat(formatUnits(minPurchase, 18)));
        if (maxPerAddr) setMaxTokensPerAddress(parseFloat(formatUnits(maxPerAddr, 18)));
        if (funds) setFundsWallet(funds);
        if (rate) setEthToBerthRate(Number(rate));
      } catch (err) {
        console.warn("Failed to fetch presale params:", err);
      }
    };
    loadParams();
  }, [presaleContract]);

  // -------------------- BALANCE & ALLOCATION --------------------
  const fetchUserBalance = useCallback(async () => {
    if (tokenContract && address) {
      try {
        const balance = await tokenContract.balanceOf(address);
        setUserTokenBalance(formatUnits(balance, 18));
      } catch (err) {
        console.error("Failed to fetch balance:", err);
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
      }
    }
  }, [presaleContract, address]);

  // ✅ NEW: Refresh all data function
  const refreshAllData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        fetchUserBalance(),
        fetchAllocation(),
        fetchBackendPresaleAmount(),
        refetchBalance(),
      ]);
      toast.success("Data refreshed");
    } catch (err) {
      console.error("Refresh failed:", err);
      toast.error("Failed to refresh data");
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchUserBalance, fetchAllocation, fetchBackendPresaleAmount, refetchBalance]);

  useEffect(() => {
    if (isConnected && address) {
      fetchUserBalance();
      fetchAllocation();
    }
  }, [isConnected, address, fetchUserBalance, fetchAllocation]);

  // -------------------- ESTIMATED TOKENS --------------------
  useEffect(() => {
    if (purchaseAmount) {
      const ethAmount = parseFloat(purchaseAmount);
      if (!isNaN(ethAmount) && ethAmount > 0) {
        const tokens = ethAmount * ethToBerthRate;
        setEstimatedTokens(tokens.toFixed(4));
      } else {
        setEstimatedTokens("0");
      }
    } else {
      setEstimatedTokens("0");
    }
  }, [purchaseAmount, ethToBerthRate]);

  // ✅ NEW: Enhanced purchase with gas estimation
  const handlePurchase = async () => {
    if (!signer || !presaleContract) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!isOnMainnet) {
      toast.error("Please switch to Ethereum Mainnet");
      await ensureMainnet();
      return;
    }

    if (!purchaseValidation.isValid) {
      toast.error(purchaseValidation.message);
      return;
    }

    const ethAmount = parseFloat(purchaseAmount);

    try {
      setLoading(true);
      setError("");
      
      // ✅ NEW: Estimate gas before sending
      const value = parseEther(ethAmount.toString());
      
      toast.loading("Estimating gas...", { id: "gas-estimate" });
      
      try {
        const gasEstimate = await presaleContract.buyTokens.estimateGas({ value });
        toast.dismiss("gas-estimate");
        console.log("Gas estimate:", gasEstimate.toString());
      } catch (gasErr) {
        toast.dismiss("gas-estimate");
        console.error("Gas estimation failed:", gasErr);
        
        // Parse gas estimation errors
        if (gasErr.message.includes("insufficient funds")) {
          throw new Error("Insufficient funds for gas");
        } else if (gasErr.message.includes("execution reverted")) {
          throw new Error("Transaction would fail. Check presale status and limits.");
        }
      }
      
      // Send transaction
      toast.loading("Please confirm in your wallet...", { id: "tx-confirm" });
      
      const tx = await presaleContract.buyTokens({ value });
      setTxHash(tx.hash);
      
      toast.dismiss("tx-confirm");
      toast.loading(`Transaction submitted: ${tx.hash.slice(0, 10)}...`, { id: "tx-pending" });
      
      // Wait for confirmation
      const receipt = await tx.wait();
      toast.dismiss("tx-pending");
      
      if (receipt.status === 1) {
        toast.success(`✅ Successfully purchased ${estimatedTokens} BERTH!`, {
          duration: 6000,
        });
        
        // Refresh all data
        await refreshAllData();
        setPurchaseAmount("");
        setTxHash("");
      } else {
        throw new Error("Transaction failed");
      }
    } catch (err) {
      console.error("Transaction failed:", err);
      toast.dismiss();
      
      // ✅ NEW: Better error parsing
      let errorMessage = "Transaction failed";
      
      if (err.code === 4001 || err.message?.includes("user rejected")) {
        errorMessage = "Transaction rejected by user";
      } else if (err.message?.includes("insufficient funds")) {
        errorMessage = "Insufficient funds for transaction + gas";
      } else if (err.message?.includes("execution reverted")) {
        errorMessage = "Transaction would fail. Check presale limits.";
      } else if (err.reason) {
        errorMessage = err.reason;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // ✅ NEW: Disconnect handler
  const handleDisconnect = () => {
    disconnect();
    toast.success("Wallet disconnected");
    setError("");
    setPurchaseAmount("");
    setUserTokenBalance("0");
    setAllocatedTokens("0");
  };

  // -------------------- UI --------------------
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

        <div className="w-full max-w-5xl relative">
          <img
            src={Banner}
            alt="BERTH Banner"
            className="w-full rounded-xl shadow-xl"
          />
          {/* ✅ NEW: Status badge */}
          <div className="absolute top-4 right-4 bg-green-500/20 border border-green-500 rounded-full px-4 py-2 backdrop-blur-sm">
            <span className="text-green-400 font-semibold flex items-center gap-2">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              Live
            </span>
          </div>
        </div>

        {/* ✅ NEW: Better error display */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-red-500/20 border border-red-500 rounded-lg p-4 max-w-md w-full"
            >
              <p className="text-red-400 font-mono text-sm text-center">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>
        
        <ProgressTube amount={amount} />

        <div className="flex flex-col items-center gap-4 w-full max-w-md bg-gradient-to-br from-gray-900 to-black p-8 rounded-3xl shadow-[0_0_30px_rgba(255,0,0,0.8)] relative">
          {/* ✅ NEW: Refresh button */}
          {isConnected && (
            <button
              onClick={refreshAllData}
              disabled={isRefreshing}
              className="absolute top-4 right-4 p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors disabled:opacity-50"
              title="Refresh data"
            >
              <svg 
                className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
                />
              </svg>
            </button>
          )}

          <w3m-button />

          {isConnected && address && (
            <>
              <div className="w-full bg-gray-800/50 rounded-lg p-4 border border-gray-700 space-y-2">
                <p className="text-green-400 font-mono text-xs text-center break-all">
                  {address.slice(0, 6)}...{address.slice(-4)}
                </p>
                <p className="text-blue-300 text-sm text-center">
                  Balance: {parseFloat(ethBalance).toFixed(4)} ETH
                  {ethPriceUSD && (
                    <span className="text-gray-400 text-xs ml-2">
                      (${(parseFloat(ethBalance) * ethPriceUSD).toFixed(2)})
                    </span>
                  )}
                </p>
                
                {allocatedTokens !== "0" && (
                  <p className="text-yellow-400 text-sm text-center">
                    Allocated: {parseFloat(allocatedTokens).toFixed(4)} BERTH
                    {maxTokensPerAddress && (
                      <span className="text-gray-400 text-xs ml-2">
                        / {maxTokensPerAddress}
                      </span>
                    )}
                  </p>
                )}
              </div>
              
              {!isOnMainnet && (
                <button
                  onClick={ensureMainnet}
                  className="bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded-lg text-sm font-semibold w-full transition-colors"
                >
                  ⚠️ Switch to Mainnet
                </button>
              )}
            </>
          )}

          {isConnected && isOnMainnet && (
            <>
              <div className="w-full space-y-2">
                <input
                  type="number"
                  placeholder={`Enter ETH amount ${minPurchaseEth ? `(min: ${minPurchaseEth})` : ''}`}
                  value={purchaseAmount}
                  onChange={(e) => setPurchaseAmount(e.target.value)}
                  className="w-full rounded-lg px-4 py-3 bg-gray-800 text-white border border-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
                  min={minPurchaseEth || "0.0025"}
                  step="any"
                  disabled={loading}
                />
                
                {/* ✅ NEW: Validation feedback */}
                {purchaseAmount && !purchaseValidation.isValid && (
                  <p className="text-red-400 text-xs">{purchaseValidation.message}</p>
                )}
              </div>
              
              {purchaseAmount && estimatedTokens !== "0" && purchaseValidation.isValid && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="w-full bg-gray-800/50 rounded-lg p-3 border border-gray-700"
                >
                  <p className="text-sm text-gray-400 text-center">
                    You will receive approximately
                  </p>
                  <p className="text-2xl font-bold text-red-500 text-center">
                    {estimatedTokens} BERTH
                  </p>
                  {ethPriceUSD && (
                    <p className="text-xs text-gray-500 text-center mt-1">
                      ≈ ${(parseFloat(purchaseAmount) * ethPriceUSD).toFixed(2)} USD
                    </p>
                  )}
                </motion.div>
              )}

              <button
                onClick={handlePurchase}
                disabled={loading || !purchaseValidation.isValid || !purchaseAmount}
                className={`bg-red-600 hover:bg-red-700 px-6 py-3 rounded-full text-lg font-semibold w-full transition-all ${
                  loading || !purchaseValidation.isValid || !purchaseAmount
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:scale-105"
                }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Processing...
                  </span>
                ) : (
                  "Purchase Tokens"
                )}
              </button>

              {/* ✅ NEW: Transaction link */}
              {txHash && (
                <a
                  href={`https://etherscan.io/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 text-sm underline"
                >
                  View transaction on Etherscan
                </a>
              )}

              {minPurchaseEth && (
                <p className="text-xs text-gray-500 text-center">
                  Min: {minPurchaseEth} ETH | Rate: 1 ETH = {ethToBerthRate} BERTH
                </p>
              )}

              <button
                onClick={handleDisconnect}
                className="text-gray-400 hover:text-white text-sm underline"
              >
                Disconnect Wallet
              </button>
            </>
          )}
        </div>
        
        <Footer />
      </motion.div>
    </>
  );
};

export default PresaleDashboard;