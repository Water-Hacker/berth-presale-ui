const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
require("dotenv").config(); // Load ADMIN_SECRET

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// File path to save presale amount persistently
const DATA_FILE = path.join(__dirname, "presaleAmount.json");

// Load presaleAmount from file or use default
let presaleAmount = 261401379;

function loadPresaleAmount() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, "utf8");
      const data = JSON.parse(raw);
      if (typeof data.amount === "number") {
        presaleAmount = data.amount;
        console.log(`Loaded presaleAmount from file: ${presaleAmount}`);
      }
    }
  } catch (err) {
    console.error("Failed to load presaleAmount from file:", err);
  }
}

function savePresaleAmount() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ amount: presaleAmount }), "utf8");
    console.log(`Saved presaleAmount to file: ${presaleAmount}`);
  } catch (err) {
    console.error("Failed to save presaleAmount to file:", err);
  }
}

// Initialize on server start
loadPresaleAmount();

// 🔁 Every 5 minutes, add 2100–3000 randomly and save
setInterval(() => {
  const randomIncrement = Math.floor(Math.random() * (3000 - 2100 + 1)) + 2100;
  presaleAmount += randomIncrement;
  console.log(`Presale amount increased by ${randomIncrement}. New total: ${presaleAmount}`);
  savePresaleAmount();
}, 5 * 60 * 1000); // 5 minutes in milliseconds

// Public endpoint
app.get("/api/presale-amount", (req, res) => {
  res.json({ amount: presaleAmount });
});

// Admin endpoint
app.post("/api/update-amount", (req, res) => {
  const { amount, secret } = req.body;
  if (secret !== process.env.ADMIN_SECRET) {
    return res.status(403).json({ message: "Forbidden: Invalid secret" });
  }

  if (typeof amount === "number" && amount >= 0) {
    presaleAmount = amount;
    savePresaleAmount();
    res.json({ success: true, newAmount: presaleAmount });
  } else {
    res.status(400).json({ message: "Invalid amount" });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Backend running at http://localhost:${PORT}`);
});
