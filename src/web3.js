// src/Web3Provider.jsx
import React from "react";
import { WagmiConfig, configureChains, createConfig } from "wagmi";
import { publicProvider } from "wagmi/providers/public";
import { w3mProvider, EthereumClient, w3mConnectors } from "@web3modal/ethereum";
import { Web3Modal } from "@web3modal/react";

// WalletConnect Project ID
const projectId = "cc68db6191b0e53eba0cc185492e5a92";

// === Ethereum Mainnet ===
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
    default: {
      name: "Etherscan",
      url: "https://etherscan.io",
    },
  },
};

// === WalletConnect Metadata ===
const metadata = {
  name: "BERTH Presale",
  description:
    "BERTH isn’t just a token — it’s the backbone of Blockearth’s digital economy. The exclusive currency of a rising Web3 nation.",
  url: "https://blockearth.app", // must match redirect domain
  icons: ["https://blockearth.app/logo.svg"],
  redirect: {
    native: "", // for native apps
    universal: "https://blockearth.app", // this helps return to mobile web dApp
  },
};

// === Configure Chains ===
const chains = [mainnet];

const { publicClient, webSocketPublicClient } = configureChains(
  chains,
  [w3mProvider({ projectId }), publicProvider()]
);

// === Wagmi + WalletConnect Config ===
export const wagmiConfig = createConfig({
  autoConnect: true,
  connectors: w3mConnectors({
    projectId,
    version: 2,
    chains,
    metadata,
    options: {
      // This makes mobile wallets redirect back to your site
      returnStrategy: "redirect",
    },
  }),
  publicClient,
  webSocketPublicClient,
});

// === Web3Modal Client ===
export const ethereumClient = new EthereumClient(wagmiConfig, chains);

// === App Provider ===
export const Web3Provider = ({ children }) => {
  return (
    <>
      <WagmiConfig config={wagmiConfig}>{children}</WagmiConfig>
      <Web3Modal
        projectId={projectId}
        ethereumClient={ethereumClient}
        themeMode="dark"
        themeColor="red"
        mobileWallets={[
          // Optional: Prioritize certain wallets on mobile
          { id: "metamask" },
          { id: "trust" },
          { id: "rainbow" },
          { id: "coinbase" },
        ]}
      />
    </>
  );
};
