// src/index.js
import "./react-app-polyfill";
import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { Web3Provider } from "./web3"; // ✅ your WalletConnect setup file
import "./i18n"; // ✅ localization (if used)

// ✅ Create root container
const root = ReactDOM.createRoot(document.getElementById("root"));

// ✅ Render the app inside Web3 context
root.render(
  <React.StrictMode>
    <Web3Provider>
      <App />
    </Web3Provider>
  </React.StrictMode>
);

// ✅ Optional performance tracking
reportWebVitals();
