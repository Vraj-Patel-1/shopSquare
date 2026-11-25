require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

// Import API routes
const productRoutes = require("./routes/productRoutes");
const authRoutes = require("./routes/authRoutes");
const orderRoutes = require("./routes/orderRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

const app = express();

// Middleware
app.use(
  cors({
    origin: "http://localhost:5173"
  })
);

app.use(express.json({ limit: "100kb" }));

// Server health check
app.get("/", (req, res) => {
  res.json({
    message: "shopSquare Backend API is running"
  });
});

// API routes
app.use("/api/products", productRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/notifications", notificationRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error("Server error:", err.message);

  res.status(500).json({
    message: "Internal server error"
  });
});

// Server port
const PORT = process.env.PORT || 5000;

// Connect MongoDB and start server
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected successfully");

    app.listen(PORT, () => {
      console.log(
        `shopSquare backend running on http://localhost:${PORT}`
      );
    });
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  });