const express = require("express");
const mongoose = require("mongoose");
const Order = require("../models/Order");
const Product = require("../models/Product");

const {
  sendNotificationToUser
} = require("../services/pushService");

const {
  protect,
  adminOnly
} = require("../middleware/authMiddleware");

const router = express.Router();

const validId = (id) =>
  mongoose.isValidObjectId(id);

// ==========================================
// CREATE ORDER
// ==========================================

router.post("/", protect, async (req, res) => {
  try {
    const { items, shippingAddress } = req.body || {};

    if (
      !Array.isArray(items) ||
      items.length === 0 ||
      typeof shippingAddress !== "string" ||
      !shippingAddress.trim()
    ) {
      return res.status(400).json({
        message: "Items and shipping address are required."
      });
    }

    const orderItems = [];
    const quantities = new Map();
    let totalAmount = 0;

    for (const item of items) {
      if (
        !item ||
        !validId(item.product) ||
        !Number.isInteger(item.quantity) ||
        item.quantity < 1
      ) {
        return res.status(400).json({
          message: "Invalid product or quantity."
        });
      }

      const id = String(item.product).toLowerCase();

      quantities.set(
        id,
        (quantities.get(id) || 0) + item.quantity
      );
    }

    for (const [id, quantity] of quantities) {
      const product = await Product.findById(id);

      if (!product) {
        return res.status(404).json({
          message: "Product not found."
        });
      }

      if (product.stock < quantity) {
        return res.status(400).json({
          message: `Insufficient stock for ${product.name}.`
        });
      }

      orderItems.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity
      });

      totalAmount +=
        Math.round(product.price * 100) * quantity;
    }

    const order = await Order.create({
      customer: req.user._id,
      items: orderItems,
      shippingAddress: shippingAddress.trim(),
      totalAmount: totalAmount / 100
    });

    res.status(201).json(order);

  } catch (error) {
    console.error("Create order error:", error);

    res.status(500).json({
      message: "Failed to create order."
    });
  }
});

// ==========================================
// READ ALL ORDERS
// ==========================================

router.get("/", protect, async (req, res) => {
  try {
    const filter =
      req.user.role === "admin"
        ? {}
        : { customer: req.user._id };

    const orders = await Order.find(filter)
      .populate("customer", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json(orders);

  } catch (error) {
    console.error("Read orders error:", error);

    res.status(500).json({
      message: "Failed to retrieve orders."
    });
  }
});

// ==========================================
// READ SINGLE ORDER
// ==========================================

router.get("/:id", protect, async (req, res) => {
  try {
    if (!validId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid order ID."
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        message: "Order not found."
      });
    }

    if (
      req.user.role !== "admin" &&
      String(order.customer) !== String(req.user._id)
    ) {
      return res.status(403).json({
        message: "Access denied."
      });
    }

    res.status(200).json(order);

  } catch (error) {
    console.error("Read order error:", error);

    res.status(500).json({
      message: "Failed to retrieve order."
    });
  }
});

// ==========================================
// UPDATE ORDER STATUS — ADMIN ONLY
// ==========================================

router.put("/:id", protect, adminOnly, async (req, res) => {
  try {
    if (!validId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid order ID."
      });
    }

    const status = req.body?.status;

    const allowedStatuses = [
      "Pending",
      "Confirmed",
      "Shipped",
      "Delivered",
      "Cancelled"
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid or missing order status."
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        message: "Order not found."
      });
    }

    // Store the previous status
    const previousStatus = order.status;

    order.status = status;

    await order.save();

    console.log("Order updated:", order._id);
    console.log("Previous status:", previousStatus);
    console.log("New status:", order.status);

    // Return the successful order update
    res.status(200).json(order);

    // Send notification only if the status changed
    if (previousStatus !== status) {
      const orderNumber = String(order._id)
        .slice(-8)
        .toUpperCase();

      sendNotificationToUser(order.customer, {
        title: "shopSquare Order Update",
        body: `Your order #${orderNumber} is now ${status}.`
      }).catch((error) => {
        console.error(
          "Order notification error:",
          error.message
        );
      });
    }

  } catch (error) {
    console.error("Update order error:", error);

    res.status(500).json({
      message: "Failed to update order."
    });
  }
});

// ==========================================
// DELETE ORDER — ADMIN ONLY
// ==========================================

router.delete("/:id", protect, adminOnly, async (req, res) => {
  try {
    if (!validId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid order ID."
      });
    }

    const order = await Order.findByIdAndDelete(
      req.params.id
    );

    if (!order) {
      return res.status(404).json({
        message: "Order not found."
      });
    }

    res.status(200).json({
      message: "Order deleted successfully."
    });

  } catch (error) {
    console.error("Delete order error:", error);

    res.status(500).json({
      message: "Failed to delete order."
    });
  }
});

module.exports = router;