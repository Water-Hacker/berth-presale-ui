import React from "react";
import { WagmiConfig, configureChains, createConfig } from "wagmi";
import { publicProvider } from "wagmi/providers/public";
import { w3mProvider, EthereumClient, w3mConnectors } from "@web3modal/ethereum";
import { Web3Modal } from "@web3modal/react";

// Your WalletConnect project ID
const projectId = "cc68db6191b0e53eba0cc185492e5a92";

// Define Ethereum mainnet chain object
const mainnet = {
  id: 1,
  name: "Ethereum",
  network: "homestead",
  nativeCurrency: {
    name: "Ether",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.ankr.com/eth"],
    },
    public: {
      http: ["https://rpc.ankr.com/eth"],
    },
  },
  blockExplorers: {
    default: { name: "Etherscan", url: "https://etherscan.io" },
  },
};

// Metadata including redirect URLs for mobile wallet return
const metadata = {
  name: "BERTH Presale",
  description:
    "BERTH isn’t just a token — it’s the backbone of Blockearth’s digital economy. As the exclusive currency of a rising Web3 nation, its value isn't just in numbers — it's in ownership, access, and power. Early holders won’t just profit — they’ll dominate, the choice is yours. Awaiting our investors in BlockEarth 2.0. Thanks for your Trust",
  url: "https://blockearth.app",
  icons: ["https://blockearth.app/logo.svg"],
  redirect: {
    native: "", // leave empty if no native mobile app
    universal: "https://blockearth.app", // IMPORTANT for mobile wallets to return
  },
};

// Setup chains and providers
const chains = [mainnet];

const { publicClient, webSocketPublicClient } = configureChains(
  chains,
  [w3mProvider({ projectId }), publicProvider()] // Order matters!
);

// Create Wagmi config with connectors including metadata and returnStrategy
export const wagmiConfig = createConfig({
  autoConnect: true,
  connectors: w3mConnectors({
    projectId,
    version: 2,
    chains,
    metadata,
    options: {
      returnStrategy: "redirect", // Helps mobile wallets redirect back to your dApp
    },
  }),
  publicClient,
  webSocketPublicClient,
});

// Ethereum client for Web3Modal
export const ethereumClient = new EthereumClient(wagmiConfig, chains);

// Provider wrapper component for your app
export const Web3Provider = ({ children }) => (
  <>
    <WagmiConfig config={wagmiConfig}>{children}</WagmiConfig>
    <Web3Modal projectId={projectId} ethereumClient={ethereumClient} />
  </>
);
