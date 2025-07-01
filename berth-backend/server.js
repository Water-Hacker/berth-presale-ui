const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = 5000;
app.use(cors());
app.use(express.json());

const DATA_FILE = path.join(__dirname, "data.json");

let presaleAmount = 261401379;

// Load existing saved amount
try {
  if (fs.existsSync(DATA_FILE)) {
    const saved = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    if (typeof saved.amount === "number") {
      presaleAmount = saved.amount;
      console.log(`🧠 Loaded saved presale amount: ${presaleAmount}`);
    }
  }
} catch (err) {
  console.error("❌ Failed to load data file:", err);
}

// ⏱ Auto-increment every 5 minutes
setInterval(() => {
  const increment = Math.floor(Math.random() * (3000 - 2100 + 1)) + 2100;
  presaleAmount += increment;

  fs.writeFileSync(DATA_FILE, JSON.stringify({ amount: presaleAmount }));
  console.log(`⏫ Increased by ${increment}, new total: ${presaleAmount}`);
}, 5 * 60 * 1000);

// Public endpoint
app.get("/api/presale-amount", (req, res) => {
  res.json({ amount: presaleAmount });
});

// Admin endpoint
app.post("/api/update-amount", (req, res) => {
  const { amount, secret } = req.body;
  if (secret !== process.env.ADMIN_SECRET) {
    return res.status(403).json({ message: "Forbidden" });
  }

  if (typeof amount === "number" && amount >= 0) {
    presaleAmount = amount;
    fs.writeFileSync(DATA_FILE, JSON.stringify({ amount: presaleAmount }));
    return res.json({ success: true, newAmount: presaleAmount });
  }

  return res.status(400).json({ message: "Invalid amount" });
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
