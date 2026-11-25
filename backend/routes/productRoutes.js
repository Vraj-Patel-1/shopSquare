
const express = require("express");
const mongoose = require("mongoose");
const Product = require("../models/Product");
const {
  protect,
  adminOnly
} = require("../middleware/authMiddleware");

const router = express.Router();

const allowedFields = [
  "name",
  "description",
  "price",
  "category",
  "image",
  "stock"
];

function pickProductFields(body) {
  const result = {};

  for (const field of allowedFields) {
    if (Object.prototype.hasOwnProperty.call(body, field)) {
      result[field] = body[field];
    }
  }

  return result;
}

function validId(id) {
  return mongoose.isObjectIdOrHexString(id);
}

// CREATE PRODUCT - ADMIN ONLY
router.post("/", protect, adminOnly, async (req, res) => {
  try {
    const product = await Product.create(
      pickProductFields(req.body)
    );

    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({
      message: "Unable to create product",
      error: error.message
    });
  }
});

// READ ALL PRODUCTS - PUBLIC
router.get("/", async (req, res) => {
  try {
    const products = await Product.find().sort({
      createdAt: -1
    });

    res.json(products);
  } catch (error) {
    res.status(500).json({
      message: "Unable to load products"
    });
  }
});

// READ ONE PRODUCT - PUBLIC
router.get("/:id", async (req, res) => {
  try {
    if (!validId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid product ID"
      });
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        message: "Product not found"
      });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({
      message: "Unable to load product"
    });
  }
});

// UPDATE PRODUCT - ADMIN ONLY
router.put("/:id", protect, adminOnly, async (req, res) => {
  try {
    if (!validId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid product ID"
      });
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: pickProductFields(req.body) },
      {
        new: true,
        runValidators: true
      }
    );

    if (!product) {
      return res.status(404).json({
        message: "Product not found"
      });
    }

    res.json(product);
  } catch (error) {
    res.status(400).json({
      message: "Unable to update product",
      error: error.message
    });
  }
});

// DELETE PRODUCT - ADMIN ONLY
router.delete("/:id", protect, adminOnly, async (req, res) => {
  try {
    if (!validId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid product ID"
      });
    }

    const product = await Product.findByIdAndDelete(
      req.params.id
    );

    if (!product) {
      return res.status(404).json({
        message: "Product not found"
      });
    }

    res.json({
      message: "Product deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      message: "Unable to delete product"
    });
  }
});

module.exports = router;
