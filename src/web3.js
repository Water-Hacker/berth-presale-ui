// src/web3.js
import React from "react";
import { WagmiProvider, createConfig, http, fallback, createStorage } from "wagmi";
import { mainnet } from "wagmi/chains";
import { walletConnect, injected, coinbaseWallet } from "wagmi/connectors";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createWeb3Modal } from "@web3modal/wagmi/react";
import toast, { Toaster } from "react-hot-toast";

// ✅ WalletConnect Project ID from .env
// Replace this line:


// With this:
const projectId = "cc68db6191b0e53eba0cc185492e5a92"; // <-- replace with actual WalletConnect project ID

const isValidProjectId = typeof projectId === "string" && projectId.length >= 24;

if (!isValidProjectId) {
  console.warn(
    "⚠️ Missing WalletConnect Project ID. Add REACT_APP_WC_PROJECT_ID to your .env"
  );
}

// === Metadata ===
const metadata = {
  name: "BERTH Token Presale",
  description: "Buy BERTH Token securely using WalletConnect (Ethereum Mainnet only).",
  url: typeof window !== "undefined" ? window.location.origin : "http://localhost:3000",
  icons: [
    typeof window !== "undefined" 
      ? `${window.location.origin}/logo512.png` 
      : "http://localhost:3000/logo512.png"
  ],
};

// === Wagmi Config with Advanced Features ===
export const config = createConfig({
  chains: [mainnet],
  
  // 🔥 FEATURE 1: Fallback RPC Providers (Better Reliability)
  transports: {
    [mainnet.id]: fallback([
      http("https://eth.llamarpc.com"),
      http("https://rpc.ankr.com/eth"),
      http("https://cloudflare-eth.com"),
      http("https://ethereum.publicnode.com"),
    ], {
      rank: true, // Automatically rank by speed
      retryCount: 3,
    }),
  },
  
  connectors: isValidProjectId
    ? [
        // 🔥 Injected connector with EIP-6963 support (Multi-wallet detection)
        injected({ 
          shimDisconnect: true,
          target() {
            return {
              id: "injected",
              name: "Browser Wallet",
              provider: typeof window !== "undefined" ? window.ethereum : undefined,
            };
          },
        }),
        
        // 🌐 WalletConnect
        walletConnect({
          projectId,
          metadata,
          showQrModal: false,
          qrModalOptions: {
            themeMode: "dark",
            themeVariables: {
              "--wcm-z-index": "9999",
            },
          },
        }),
        
        // 💼 Coinbase Wallet
        coinbaseWallet({
          appName: metadata.name,
          appLogoUrl: metadata.icons[0],
          darkMode: true,
          reloadOnDisconnect: false,
        }),
      ]
    : [
        injected({ shimDisconnect: true }),
      ],
  
  // 🔥 FEATURE 2: Session Storage & Auto-Reconnect
  storage: createStorage({
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
  }),
  
  // Performance optimizations
  batch: {
    multicall: {
      batchSize: 2048,
      wait: 16,
    },
  },
  pollingInterval: 12_000,
  ssr: false,
});

// === Query Client with Enhanced Settings ===
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      retry: 2,
      staleTime: 10_000,
      gcTime: 5 * 60 * 1000,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10_000),
    },
    mutations: {
      retry: 1,
    },
  },
});

// === Web3Modal Setup ===
if (isValidProjectId) {
  createWeb3Modal({
    wagmiConfig: config,
    projectId,
    chains: [mainnet],
    
    themeMode: "dark",
    themeVariables: {
      "--w3m-accent": "#ff0000",
      "--w3m-color-mix": "#000000",
      "--w3m-color-mix-strength": 20,
      "--w3m-font-family": "Inter, sans-serif",
      "--w3m-border-radius-master": "4px",
      "--w3m-z-index": "9999",
    },
    
    featuredWalletIds: [
      "c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96", // MetaMask
      "4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0", // Trust Wallet
      "fd20dc426fb37566d803205b19bbc1d4096b248ac04548e3cfb6b3a38bd033aa", // Coinbase Wallet
      "1ae92b26df02f0abca6304df07debccd18262fdf5fe82daa81593582dac9a369", // Rainbow
      "163d2cf19babf05eb8962e9748f9ebe613ed52ebf9c8107c9a0f104bfcf161b3", // OKX Wallet
    ],
    
    enableAnalytics: false,
    enableOnramp: false,
    
    mobileWallets: [
      {
        id: "metamask",
        name: "MetaMask",
        links: {
          native: "metamask://",
          universal: "https://metamask.app.link",
        },
      },
      {
        id: "trust",
        name: "Trust Wallet",
        links: {
          native: "trust://",
          universal: "https://link.trustwallet.com",
        },
      },
      {
        id: "rainbow",
        name: "Rainbow",
        links: {
          native: "rainbow://",
          universal: "https://rainbow.me",
        },
      },
      {
        id: "coinbase",
        name: "Coinbase Wallet",
        links: {
          native: "cbwallet://",
          universal: "https://go.cb-w.com",
        },
      },
    ],
    
    desktopWallets: [
      {
        id: "metamask",
        name: "MetaMask",
        links: {
          native: "",
          universal: "https://metamask.io",
        },
      },
    ],
    
    includeWalletIds: [
      "c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96",
      "4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0",
      "fd20dc426fb37566d803205b19bbc1d4096b248ac04548e3cfb6b3a38bd033aa",
      "1ae92b26df02f0abca6304df07debccd18262fdf5fe82daa81593582dac9a369",
    ],
    
    excludeWalletIds: [],
  });
}

// ========================================
// 🔥 ADVANCED FEATURES & CUSTOM HOOKS
// ========================================

// 🔥 FEATURE 3: Network Validation Hook
export const useNetworkValidation = () => {
  const [account, setAccount] = React.useState(null);
  
  React.useEffect(() => {
    if (typeof window === "undefined" || !window.ethereum) return;
    
    const checkNetwork = async () => {
      try {
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        const isCorrectNetwork = parseInt(chainId, 16) === mainnet.id;
        
        if (!isCorrectNetwork) {
          toast.error("⚠️ Wrong network! Please switch to Ethereum Mainnet", {
            duration: 5000,
            icon: "🔴",
          });
        }
        
        setAccount({ chainId: parseInt(chainId, 16), isCorrectNetwork });
      } catch (error) {
        console.error("Network check error:", error);
      }
    };
    
    checkNetwork();
    
    // Listen for network changes
    window.ethereum?.on?.('chainChanged', checkNetwork);
    
    return () => {
      window.ethereum?.removeListener?.('chainChanged', checkNetwork);
    };
  }, []);
  
  return { 
    isCorrectNetwork: account?.isCorrectNetwork ?? false,
    currentChainId: account?.chainId 
  };
};

// 🔥 FEATURE 4: Wallet Detection Hook
export const useDetectWallets = () => {
  const [detectedWallets, setDetectedWallets] = React.useState([]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const detected = [];
    
    // Check for MetaMask
    if (window.ethereum?.isMetaMask) {
      detected.push({ name: "MetaMask", id: "metamask", detected: true });
    }
    
    // Check for Trust Wallet
    if (window.ethereum?.isTrust) {
      detected.push({ name: "Trust Wallet", id: "trust", detected: true });
    }
    
    // Check for Coinbase Wallet
    if (window.ethereum?.isCoinbaseWallet) {
      detected.push({ name: "Coinbase Wallet", id: "coinbase", detected: true });
    }
    
    // Check for OKX Wallet
    if (window.okxwallet) {
      detected.push({ name: "OKX Wallet", id: "okx", detected: true });
    }
    
    // Check for Rainbow
    if (window.ethereum?.isRainbow) {
      detected.push({ name: "Rainbow", id: "rainbow", detected: true });
    }
    
    // Check for Brave Wallet
    if (window.ethereum?.isBraveWallet) {
      detected.push({ name: "Brave Wallet", id: "brave", detected: true });
    }
    
    // Generic ethereum provider
    if (window.ethereum && detected.length === 0) {
      detected.push({ name: "Browser Wallet", id: "injected", detected: true });
    }
    
    setDetectedWallets(detected);
    
    // Toast notification for detected wallets
    if (detected.length > 0) {
      toast.success(`✅ Detected ${detected.length} wallet(s)`, {
        duration: 3000,
      });
    }
  }, []);

  return detectedWallets;
};

// 🔥 FEATURE 5: Connection Status Monitoring
export const useConnectionStatus = () => {
  const [status, setStatus] = React.useState({
    isConnected: false,
    isConnecting: false,
    address: null,
    connector: null,
  });
  
  React.useEffect(() => {
    if (typeof window === "undefined" || !window.ethereum) return;
    
    const checkConnection = async () => {
      try {
        const accounts = await window.ethereum.request({ 
          method: 'eth_accounts' 
        });
        
        setStatus({
          isConnected: accounts.length > 0,
          isConnecting: false,
          address: accounts[0] || null,
          connector: window.ethereum.isMetaMask ? 'MetaMask' : 'Unknown',
        });
      } catch (error) {
        console.error("Connection check error:", error);
      }
    };
    
    checkConnection();
    
    // Listen for account changes
    window.ethereum?.on?.('accountsChanged', (accounts) => {
      setStatus(prev => ({
        ...prev,
        isConnected: accounts.length > 0,
        address: accounts[0] || null,
      }));
      
      if (accounts.length === 0) {
        toast.error("Wallet disconnected", { icon: "🔌" });
      } else {
        toast.success("Wallet connected!", { icon: "✅" });
      }
    });
    
    return () => {
      window.ethereum?.removeListener?.('accountsChanged', () => {});
    };
  }, []);
  
  return status;
};

// 🔥 FEATURE 6: Mobile Detection
export const useMobileDetection = () => {
  const [isMobile, setIsMobile] = React.useState(false);
  const [os, setOS] = React.useState("Unknown");
  
  React.useEffect(() => {
    const checkMobile = () => {
      const ua = navigator.userAgent;
      const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
      
      let detectedOS = "Unknown";
      if (/android/i.test(ua)) detectedOS = "Android";
      else if (/iPad|iPhone|iPod/.test(ua)) detectedOS = "iOS";
      else if (/Windows/i.test(ua)) detectedOS = "Windows";
      else if (/Mac/i.test(ua)) detectedOS = "macOS";
      else if (/Linux/i.test(ua)) detectedOS = "Linux";
      
      setIsMobile(mobile);
      setOS(detectedOS);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  return { isMobile, os };
};

// 🔥 FEATURE 7: Wallet Security Checks
export const useWalletSecurity = () => {
  const [securityChecks, setSecurityChecks] = React.useState({
    isSecureConnection: false,
    hasWalletInstalled: false,
    isRecommendedWallet: false,
  });
  
  React.useEffect(() => {
    const checks = {
      isSecureConnection: window.location.protocol === 'https:',
      hasWalletInstalled: typeof window.ethereum !== 'undefined',
      isRecommendedWallet: window.ethereum?.isMetaMask || 
                          window.ethereum?.isCoinbaseWallet ||
                          window.ethereum?.isTrust,
    };
    
    setSecurityChecks(checks);
    
    // Show warning if not secure
    if (!checks.isSecureConnection && checks.hasWalletInstalled) {
      toast.error("⚠️ Using insecure connection (HTTP). Please use HTTPS!", {
        duration: 8000,
      });
    }
  }, []);
  
  return securityChecks;
};

// 🔥 FEATURE 8: Gas Price Monitoring Hook
export const useGasPrice = () => {
  const [gasData, setGasData] = React.useState({
    gasPrice: null,
    gasPriceGwei: null,
    speedCategory: "Unknown",
  });
  
  React.useEffect(() => {
    const fetchGasPrice = async () => {
      if (!window.ethereum) return;
      
      try {
        const price = await window.ethereum.request({ 
          method: 'eth_gasPrice' 
        });
        const priceGwei = parseInt(price, 16) / 1e9;
        
        const category = priceGwei < 20 ? 'Low' 
                       : priceGwei < 50 ? 'Medium' 
                       : 'High';
        
        setGasData({
          gasPrice: price,
          gasPriceGwei: priceGwei.toFixed(2),
          speedCategory: category,
        });
      } catch (error) {
        console.error("Failed to fetch gas price:", error);
      }
    };
    
    fetchGasPrice();
    const interval = setInterval(fetchGasPrice, 30000); // Every 30s
    
    return () => clearInterval(interval);
  }, []);
  
  return gasData;
};

// 🔥 FEATURE 9: Error Boundary Component
export const Web3ErrorBoundary = ({ children }) => {
  React.useEffect(() => {
    const handleError = (error) => {
      console.error('Web3 Error:', error);
      
      // User-friendly error messages
      if (error.code === 4001) {
        toast.error("❌ Transaction rejected", { duration: 4000 });
      } else if (error.code === -32002) {
        toast.error("⏳ Request pending. Check your wallet.", { duration: 5000 });
      } else if (error.message?.includes('insufficient funds')) {
        toast.error("💰 Insufficient funds for transaction", { duration: 5000 });
      } else if (error.code === -32603) {
        toast.error("🔌 RPC error. Trying backup provider...", { duration: 4000 });
      } else {
        toast.error("❌ Transaction failed. Please try again.", { duration: 4000 });
      }
    };
    
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', (e) => handleError(e.reason));
    
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleError);
    };
  }, []);
  
  return children;
};

// === Main Provider Wrapper ===
export const Web3Provider = ({ children }) => {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <Web3ErrorBoundary>
          {children}
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1a1a1a',
                color: '#fff',
                border: '1px solid #333',
                borderRadius: '8px',
                fontSize: '14px',
              },
              success: {
                iconTheme: {
                  primary: '#00ff00',
                  secondary: '#000',
                },
                style: {
                  border: '1px solid #00ff00',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ff0000',
                  secondary: '#000',
                },
                style: {
                  border: '1px solid #ff0000',
                },
              },
              loading: {
                iconTheme: {
                  primary: '#ffaa00',
                  secondary: '#000',
                },
              },
            }}
          />
        </Web3ErrorBoundary>
      </QueryClientProvider>
    </WagmiProvider>
  );
};

export default Web3Provider;