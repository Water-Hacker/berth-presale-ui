// Quick on-chain presale verifier
// Prints the receiver wallet (fundsWallet) and key limits directly from Ethereum mainnet.
// Usage:
//   PRESALE_ADDRESS=0x... RPC_URL=https://... node scripts/check-presale.mjs
// Env:
//   - PRESALE_ADDRESS (optional): defaults to the address used in the frontend
//   - RPC_URL (optional): if provided, used first; falls back to public RPCs

import { ethers } from 'ethers';

// Minimal ABI for reads we need
const PRESALE_ABI = [
  { inputs: [], name: 'fundsWallet', outputs: [{ internalType: 'address', name: '', type: 'address' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'MIN_PURCHASE', outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'MAX_TOKENS_PER_ADDRESS', outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'getCurrentPrice', outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' },
];

// Default to the address defined in the app
const DEFAULT_PRESALE = '0x79D2603811b54576b8E06f1bC3d2bd30EC0eF058';
const PRESALE_ADDRESS = (process.env.PRESALE_ADDRESS || DEFAULT_PRESALE).trim();

// Prefer user-supplied RPC, otherwise try a few reliable public providers in order.
const CANDIDATE_RPCS = [
  process.env.RPC_URL,
  'https://cloudflare-eth.com',
  'https://eth.llamarpc.com',
  'https://rpc.ankr.com/eth',
].filter(Boolean);

function isHexAddress(addr) {
  try { return ethers.isAddress(addr); } catch { return false; }
}

async function tryProvider(url) {
  const provider = new ethers.JsonRpcProvider(url);
  // Light probe: get latest block number with a timeout
  const timeoutMs = 8000;
  const probe = provider.getBlockNumber();
  const timed = Promise.race([
    probe,
    new Promise((_, rej) => setTimeout(() => rej(new Error('RPC timeout')), timeoutMs)),
  ]);
  await timed;
  return provider;
}

async function getWorkingProvider() {
  let firstError;
  for (const url of CANDIDATE_RPCS) {
    try {
      const p = await tryProvider(url);
      return p;
    } catch (e) {
      firstError = firstError || e;
      // continue trying others
    }
  }
  throw firstError || new Error('No working RPC endpoints');
}

async function main() {
  if (!isHexAddress(PRESALE_ADDRESS)) {
    console.error('Invalid PRESALE_ADDRESS:', PRESALE_ADDRESS);
    process.exit(1);
  }

  console.log('— Presale verifier —');
  console.log('Contract:', PRESALE_ADDRESS);

  const provider = await getWorkingProvider();
  const network = await provider.getNetwork();
  if (network.chainId !== 1n) {
    console.warn(`Warning: Connected to chainId ${network.chainId} (expected 1 for Ethereum mainnet)`);
  } else {
    console.log('Network: Ethereum mainnet');
  }

  const code = await provider.getCode(PRESALE_ADDRESS);
  if (!code || code === '0x') {
    console.error('No contract code found at address. Is the address correct and on mainnet?');
    process.exit(1);
  }

  const contract = new ethers.Contract(PRESALE_ADDRESS, PRESALE_ABI, provider);

  const [funds, minWei, maxTokens, priceWei] = await Promise.all([
    contract.fundsWallet().catch(() => null),
    contract.MIN_PURCHASE().catch(() => null),
    contract.MAX_TOKENS_PER_ADDRESS().catch(() => null),
    contract.getCurrentPrice().catch(() => null),
  ]);

  console.log('Receiver (fundsWallet):', funds || 'N/A');
  if (minWei) console.log('MIN_PURCHASE (ETH):', ethers.formatEther(minWei));
  if (maxTokens) console.log('MAX_TOKENS_PER_ADDRESS (BERTH):', ethers.formatUnits(maxTokens, 18));
  if (priceWei && priceWei > 0n) {
    const tokensPerEth = Number(ethers.parseEther('1')) / Number(priceWei);
    console.log('Current price (wei per token):', priceWei.toString());
    console.log('Estimated tokens per 1 ETH:', tokensPerEth.toFixed(4));
  }
}

main().catch((e) => {
  console.error('Error:', e.message || e);
  process.exit(1);
});
