import React from 'react';

const Hero = () => {
  return (
    <section className="bg-gradient-to-br from-[#0f0f0f] via-[#1a1a1a] to-black text-white min-h-[90vh] flex items-center justify-center px-6">
      <div className="text-center max-w-3xl">
        <h1 className="text-5xl md:text-6xl font-extrabold mb-6 leading-tight">
          Welcome to <span className="text-red-600">Block Earth</span>
        </h1>
        <p className="text-lg md:text-xl text-gray-300 mb-8">
          The next evolution of digital civilization — become a Berthian and claim your place in the cryptographic Earth.
        </p>
        <a
          href="#buy"
          className="inline-block px-8 py-3 text-lg font-semibold bg-red-600 hover:bg-red-700 rounded-full transition-all shadow-lg"
        >
          Join the Presale
        </a>
      </div>
    </section>
  );
};

export default Hero;
