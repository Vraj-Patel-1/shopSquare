
const jwt = require("jsonwebtoken");
const User = require("../models/User");

async function protect(req, res, next) {
  try {
    const authorization = req.headers.authorization || "";

    if (!authorization.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Not authorized. Token missing."
      });
    }

    const token = authorization.slice(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select(
      "_id name email role"
    );

    if (!user) {
      return res.status(401).json({
        message: "User no longer exists."
      });
    }

    req.user = user;
    next();
  } catch {
    return res.status(401).json({
      message: "Invalid or expired token."
    });
  }
}

function adminOnly(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({
      message: "Admin access required."
    });
  }

  next();
}

module.exports = { protect, adminOnly };
