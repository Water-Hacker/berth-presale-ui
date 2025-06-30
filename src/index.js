// index.js
import "./react-app-polyfill";
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { Web3Provider } from './web3'; // ⬅️ Import the Web3 wrapper
import './i18n'; // or './i18n/i18n' depending on where you placed it

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Web3Provider>
      <App />
    </Web3Provider>
  </React.StrictMode>
);

reportWebVitals();
