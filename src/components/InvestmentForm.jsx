import React, { useState } from 'react';
import { motion } from 'framer-motion';

const InvestmentForm = () => {
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();

    const num = Number(amount);
    if (!num || num <= 0) {
      setError('Please enter a valid investment amount greater than 0.');
      return;
    }

    setError('');
    alert(`You are investing $${num.toLocaleString()}. (This is a demo alert)`);
    setAmount('');
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1, delay: 0.5 }}
      className="max-w-md w-full bg-gradient-to-br from-gray-900 via-black to-gray-800 p-8 rounded-xl shadow-[0_0_50px_rgba(255,0,0,0.8)]"
      style={{ transformStyle: 'preserve-3d' }}
    >
      <label
        htmlFor="amount"
        className="block text-white text-lg mb-2 font-semibold drop-shadow"
      >
        Investment Amount (USD)
      </label>

      <input
        id="amount"
        type="number"
        min="1"
        step="any"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Enter amount"
        className="w-full p-3 rounded-lg bg-black bg-opacity-60 border-2 border-red-600 text-white font-mono text-lg focus:outline-none focus:border-red-400 transition"
        style={{ boxShadow: '0 0 10px rgba(255,0,0,0.7)' }}
      />

      {error && (
        <p className="mt-2 text-red-400 text-sm font-mono italic drop-shadow">
          {error}
        </p>
      )}

      <motion.button
        type="submit"
        whileHover={{ scale: 1.05, boxShadow: '0 0 15px rgba(255,0,0,1)' }}
        whileTap={{ scale: 0.95 }}
        className="mt-6 w-full py-3 bg-gradient-to-r from-red-600 via-red-700 to-red-800 rounded-lg text-white font-extrabold text-xl drop-shadow cursor-pointer select-none"
      >
        Invest Now
      </motion.button>
    </motion.form>
  );
};

export default InvestmentForm;
