const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;
app.use(cors());
app.use(express.json());

const MONGO_URI = process.env.MONGO_URI;
const ADMIN_SECRET = process.env.ADMIN_SECRET;
const DB_NAME = "berth";
const COLLECTION = "presale";

let presaleAmount = 0;
let db, collection;

// Connect to MongoDB and load initial value
MongoClient.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then((client) => {
    db = client.db(DB_NAME);
    collection = db.collection(COLLECTION);
    console.log("✅ Connected to MongoDB");

    return collection.findOne({ _id: "presaleAmount" });
  })
  .then((doc) => {
    if (doc && typeof doc.amount === "number") {
      presaleAmount = doc.amount;
      console.log(`🧠 Loaded presale amount: ${presaleAmount}`);
    } else {
      // Initialize document if not found
      return collection.insertOne({ _id: "presaleAmount", amount: presaleAmount });
    }
  })
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Auto-increment every 5 minutes
setInterval(() => {
  const increment = Math.floor(Math.random() * (3000 - 2100 + 1)) + 2100;
  presaleAmount += increment;

  if (collection) {
    collection.updateOne(
      { _id: "presaleAmount" },
      { $set: { amount: presaleAmount } },
      { upsert: true }
    );
    console.log(`⏫ Increased by ${increment}, new total: ${presaleAmount}`);
  }
}, 5 * 60 * 1000);

// Public endpoint
app.get("/api/presale-amount", (req, res) => {
  res.json({ amount: presaleAmount });
});

// Admin endpoint
app.post("/api/update-amount", async (req, res) => {
  const { amount, secret } = req.body;
  if (secret !== ADMIN_SECRET) return res.status(403).json({ message: "Forbidden" });

  if (typeof amount === "number" && amount >= 0) {
    presaleAmount = amount;
    await collection.updateOne(
      { _id: "presaleAmount" },
      { $set: { amount: presaleAmount } },
      { upsert: true }
    );
    return res.json({ success: true, newAmount: presaleAmount });
  }

  return res.status(400).json({ message: "Invalid amount" });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
