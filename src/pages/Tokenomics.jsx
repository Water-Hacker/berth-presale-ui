import React from "react";
import { motion } from "framer-motion";
import Logo from "../assets/logo.svg"; // Ensure path is correct
import Navbar from "../components/Navbar"; // ✅ Import Navbar
import Footer from "../components/Footer";

const Whitelist = () => {
  return (
    <>
      <Navbar /> {/* ✅ Injected Navbar at the top */}

      <motion.div
        className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-black to-gray-900 text-white p-6 md:p-10"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Logo at top center */}
        <div className="w-full flex justify-center mb-10">
          <img
            src={Logo}
            alt="BERTH Logo"
            className="h-16 md:h-20 drop-shadow-[0_0_8px_red]"
          />
        </div>

        <h1 className="text-4xl font-bold mb-6 text-red-500 drop-shadow-md text-center">
          Block Earth 2.0 – BERTH Tokenomics Overview
        </h1>

        {/* --- Token Summary --- */}
        <section className="bg-black/40 p-6 rounded-2xl shadow-xl border border-red-800 mb-8 max-w-4xl mx-auto">
          <h2 className="text-2xl text-white font-semibold mb-4">📌 Token Summary</h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-gray-300">
            <li><strong>Token Name:</strong> Block Earth Token</li>
            <li><strong>Symbol:</strong> BERTH</li>
            <li><strong>Token Standard:</strong> ERC-20 (Upgradeable)</li>
            <li><strong>Total Supply:</strong> 202,000,000 BERTH</li>
            <li><strong>Initial Price:</strong> 0.025 ETH per BERTH</li>
            <li><strong>Minimum Purchase:</strong> 0.01 BERTH (0.0025ETH)</li>
            <li><strong>Decimal Precision:</strong> 8 decimals (Atoms)</li>
            <li><strong>Smallest Unit:</strong> Atom (1 BERTH = 100,000,000 Atoms)</li>
            <li><strong>Max Supply Cap:</strong> Fixed, Immutable</li>
            <li><strong>Smart Contract Lock:</strong> 2-Year Lock with Post-Launch Unlock</li>
          </ul>
        </section>

        {/* --- Token Distribution Table --- */}
        <section className="bg-black/40 p-6 rounded-2xl shadow-xl border border-red-800 mb-8 max-w-4xl mx-auto overflow-x-auto">
          <h2 className="text-2xl text-white font-semibold mb-4">📊 Token Distribution</h2>
          <table className="w-full text-left border-collapse text-gray-300">
            <thead>
              <tr className="text-sm bg-gray-800">
                <th className="p-2 border-b border-red-700">Category</th>
                <th className="p-2 border-b border-red-700">Amount</th>
                <th className="p-2 border-b border-red-700">% of Total</th>
                <th className="p-2 border-b border-red-700">Vesting / Lock Notes</th>
              </tr>
            </thead>
            <tbody>
              <tr><td className="p-2">Public Sale (Citizens)</td><td>195,000,000 BERTH</td><td>96.53%</td><td>2-Year Lock</td></tr>
              <tr><td className="p-2">Infrastructure & Partners</td><td>2,000,000 BERTH</td><td>0.99%</td><td>2-Year Lock</td></tr>
              <tr><td className="p-2">Institutional Reserve</td><td>5,000,000 BERTH</td><td>2.48%</td><td>DAO-controlled release</td></tr>
              <tr><td className="p-2">Team & Developers</td><td>0 BERTH</td><td>0%</td><td>No allocation for credibility</td></tr>
              <tr><td className="p-2">Marketing / Airdrops</td><td>0 BERTH</td><td>0%</td><td>None – strict no-hype policy</td></tr>
            </tbody>
          </table>
        </section>

        {/* --- Lock Schedule --- */}
        <section className="bg-black/40 p-6 rounded-2xl shadow-xl border border-red-800 mb-8 max-w-4xl mx-auto">
          <h2 className="text-2xl text-white font-semibold mb-4">🔒 Lock & Release Schedule</h2>
          <ul className="list-disc ml-6 text-gray-300">
            <li>T-0 (Presale Start): Token sale begins. All tokens are fully locked.</li>
            <li>T+2 Years (Launch): Tokens become active for in-platform use.</li>
            <li>T+2.5 Years: Optional exchange listing via governance approval.</li>
          </ul>
        </section>

        {/* --- Fairness --- */}
        <section className="bg-black/40 p-6 rounded-2xl shadow-xl border border-red-800 mb-8 max-w-4xl mx-auto">
          <h2 className="text-2xl text-white font-semibold mb-4">⚖️ Purchase Rules & Fairness</h2>
          <ul className="list-disc ml-6 text-gray-300">
            <li>Max per Wallet: 1000 BERTH </li>
            <li>Minimum Buy: 0.01 BERTH </li>
            <li>Gifting: Only post-launch with cap rules via smart contract</li>
            <li>Enforcement: On-chain, via whitelisted smart contract logic</li>
          </ul>
        </section>

        {/* --- Utility --- */}
        <section className="bg-black/40 p-6 rounded-2xl shadow-xl border border-red-800 mb-8 max-w-4xl mx-auto">
          <h2 className="text-2xl text-white font-semibold mb-4">💸 Token Utility</h2>
          <ul className="list-disc ml-6 text-gray-300">
            <li>Land Ownership (NFT parcels)</li>
            <li>Business Operations and Salaries</li>
            <li>Public Infrastructure and Services Access (e.g., Healthcare, Education)</li>
            <li>Governance Participation (DAOs, Proposals, Voting)</li>
            <li>Environmental Actions (NFT Trees, Offsetting Carbon)</li>
            <li>Trade and Marketplace Activity</li>
            <li>Staking and Validator Rewards</li>
          </ul>
        </section>

        {/* --- Berthian Tiers Table --- */}
        <section className="bg-black/40 p-6 rounded-2xl shadow-xl border border-red-800 max-w-4xl mx-auto overflow-x-auto">
          <h2 className="text-2xl text-white font-semibold mb-4">🏅 Berthian Tiers (Psychological Engagement)</h2>
          <table className="w-full text-left border-collapse text-gray-300">
            <thead>
              <tr className="text-sm bg-gray-800">
                <th className="p-2 border-b border-red-700">Tier Name</th>
                <th className="p-2 border-b border-red-700">Min Holding</th>
                <th className="p-2 border-b border-red-700">Special Rights</th>
              </tr>
            </thead>
            <tbody>
              <tr><td className="p-2">Watcher</td><td>0.01 to 10 BERTH</td><td>View-only Access</td></tr>
              <tr><td className="p-2">Citizen</td><td>10+ to 200 BERTH</td><td>Simulation, Voting, Land Access</td></tr>
              <tr><td className="p-2">Builder</td><td>200+ to 600 BERTH</td><td>Test Region Beta Access</td></tr>
              <tr><td className="p-2">Sage</td><td>600+ to 900 BERTH</td><td>Council Invitations</td></tr>
              <tr><td className="p-2">Guardian</td><td>900+ to 1000 BERTH</td><td>Validator Priority</td></tr>
            </tbody>
          </table>
        </section>
        <Footer />

      </motion.div>
    </>
  );
};

export default Whitelist;
