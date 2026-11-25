const express = require("express");
const PushSubscription = require("../models/PushSubscription");
const { protect } = require("../middleware/authMiddleware");
const { isTrustedEndpoint } = require("../services/pushService");

const router = express.Router();

// GET PUBLIC VAPID KEY
router.get("/public-key", (req, res) => {
  res.status(200).json({
    publicKey: process.env.VAPID_PUBLIC_KEY
  });
});

// SAVE PUSH SUBSCRIPTION
router.post("/subscribe", protect, async (req, res) => {
  try {
    const { endpoint, keys } = req.body || {};

    // Validate subscription data
    if (
      typeof endpoint !== "string" ||
      endpoint.length > 4096 ||
      !isTrustedEndpoint(endpoint) ||
      typeof keys?.p256dh !== "string" ||
      typeof keys?.auth !== "string" ||
      !keys.p256dh ||
      !keys.auth ||
      keys.p256dh.length > 256 ||
      keys.auth.length > 128
    ) {
      return res.status(400).json({
        message: "Invalid push subscription."
      });
    }

    // Only update subscriptions belonging to
    // the currently authenticated user
    await PushSubscription.findOneAndUpdate(
      {
        endpoint,
        user: req.user._id
      },
      {
        $set: {
          keys: {
            p256dh: keys.p256dh,
            auth: keys.auth
          }
        },
        $setOnInsert: {
          user: req.user._id,
          endpoint
        }
      },
      {
        upsert: true,
        new: true,
        runValidators: true
      }
    );

    res.status(201).json({
      message: "Push notifications enabled successfully."
    });

  } catch (error) {

    // Prevent duplicate endpoints and ownership changes
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Subscription is already registered."
      });
    }

    console.error("Failed to save push subscription.");

    res.status(500).json({
      message: "Failed to save subscription."
    });
  }
});

// REMOVE PUSH SUBSCRIPTION
router.post("/unsubscribe", protect, async (req, res) => {
  try {
    const { endpoint } = req.body || {};

    if (
      typeof endpoint !== "string" ||
      !endpoint ||
      endpoint.length > 4096
    ) {
      return res.status(400).json({
        message: "Subscription endpoint is required."
      });
    }

    // Users can only remove their own subscriptions
    await PushSubscription.deleteOne({
      user: req.user._id,
      endpoint
    });

    res.status(200).json({
      message: "Push notifications disabled successfully."
    });

  } catch (error) {
    console.error("Failed to remove push subscription.");

    res.status(500).json({
      message: "Failed to remove subscription."
    });
  }
});

module.exports = router;