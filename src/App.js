import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import PresaleDashboard from "./components/PresaleDashboard";
import Whitelist from "./pages/Tokenomics";
import Roadmap from "./pages/Roadmap";
import Audit from "./pages/Audit";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import { Buffer } from "buffer";
import process from "process";

window.Buffer = Buffer;
window.process = process;

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<PresaleDashboard />} />
        <Route path="/whitelist" element={<Whitelist />} />
        <Route path="/roadmap" element={<Roadmap />} />
        <Route path="/audit" element={<Audit />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      </Routes>
    </Router>
  );
};

export default App;
