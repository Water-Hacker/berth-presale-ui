const express = require("express");
const cors = require("cors");
require("dotenv").config(); // Load ADMIN_SECRET

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

let presaleAmount = 261401379; // default value (hidden from frontend)

// Fetch amount (used by frontend)
app.get("/api/presale-amount", (req, res) => {
  res.json({ amount: presaleAmount });
});

// Update amount (admin only)
app.post("/api/update-amount", (req, res) => {
  const { amount, secret } = req.body;
  if (secret !== process.env.ADMIN_SECRET) {
    return res.status(403).json({ message: "Forbidden: Invalid secret" });
  }

  if (typeof amount === "number" && amount >= 0) {
    presaleAmount = amount;
    res.json({ success: true, newAmount: presaleAmount });
  } else {
    res.status(400).json({ message: "Invalid amount" });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Backend running at http://localhost:${PORT}`);
});
