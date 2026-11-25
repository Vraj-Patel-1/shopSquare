import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Trash2,
  ArrowRight,
  ShoppingBag,
  CheckCircle
} from "lucide-react";

import { ProductImage, useCart } from "../App";

import {
  calculateSubtotal,
  isValidQuantity,
  hasEnoughStock
} from "../utils/cartUtils";

export default function Cart() {
  const { cart, removeFromCart, updateQuantity } = useCart();

  const navigate = useNavigate();

  const [shippingAddress, setShippingAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Use the unit-tested subtotal function
  const subtotal = calculateSubtotal(cart);

  async function placeOrder() {
    setError("");
    setSuccess("");

    const token = sessionStorage.getItem("shopSquareToken");

    if (!token) {
      navigate("/login");
      return;
    }

    if (!shippingAddress.trim()) {
      setError("Please enter your shipping address.");
      return;
    }

    if (cart.length === 0 || loading) {
      return;
    }

    // Use unit-tested validation functions
    for (const item of cart) {
      if (!isValidQuantity(item.quantity)) {
        setError(
          `Invalid quantity for ${item.product.name}.`
        );
        return;
      }

      if (!hasEnoughStock(
        item.quantity,
        item.product.stock
      )) {
        setError(
          `Insufficient stock for ${item.product.name}.`
        );
        return;
      }
    }

    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:5000/api/orders",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },

          body: JSON.stringify({
            items: cart.map(item => ({
              product: item.product._id,
              quantity: item.quantity
            })),

            shippingAddress: shippingAddress.trim()
          })
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        sessionStorage.removeItem("shopSquareToken");
        sessionStorage.removeItem("shopSquareUser");

        navigate("/login");
        return;
      }

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to place order."
        );
      }

      setSuccess(
        `Order placed successfully! Order ID: ${data._id}`
      );

      cart.forEach(item => {
        removeFromCart(item.product._id);
      });

      setShippingAddress("");

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong."
      );

    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-container">

      <div className="page-heading">
        <span className="eyebrow dark">
          YOUR SELECTION
        </span>

        <h1>
          Shopping Cart<span className="dot">.</span>
        </h1>

        <p>Review your items before checkout.</p>
      </div>

      {success && (
        <div
          role="status"
          style={{
            background: "#dcfce7",
            color: "#166534",
            padding: "20px",
            borderRadius: "10px",
            marginBottom: "25px",
            display: "flex",
            alignItems: "center",
            gap: "12px"
          }}
        >
          <CheckCircle size={24} />
          <strong>{success}</strong>
        </div>
      )}

      {cart.length === 0 ? (
        <div className="empty-state">

          <h2>
            {success
              ? "Thank you for your order!"
              : "Your cart is empty"}
          </h2>

          <p>
            {success
              ? "Your order has been received."
              : "Find something you'll love."}
          </p>

          <Link to="/shop" className="btn btn-dark">
            START SHOPPING <ArrowRight size={18} />
          </Link>

        </div>
      ) : (
        <div className="cart-layout">

          <div className="cart-items">

            {cart.map(item => (
              <div
                className="cart-item"
                key={item.product._id}
              >

                <div className="cart-item-image">
                  <ProductImage product={item.product} />
                </div>

                <div className="cart-item-details">

                  <span className="product-category">
                    {item.product.category}
                  </span>

                  <h3>{item.product.name}</h3>

                  <strong>
                    ${item.product.price.toFixed(2)}
                  </strong>

                  <div className="cart-item-actions">

                    <div className="quantity-control">

                      <button
                        disabled={
                          loading || item.quantity <= 1
                        }
                        onClick={() =>
                          updateQuantity(
                            item.product._id,
                            item.quantity - 1
                          )
                        }
                      >
                        −
                      </button>

                      <span>{item.quantity}</span>

                      <button
                        disabled={
                          loading ||
                          !hasEnoughStock(
                            item.quantity + 1,
                            item.product.stock
                          )
                        }
                        onClick={() =>
                          updateQuantity(
                            item.product._id,
                            item.quantity + 1
                          )
                        }
                      >
                        +
                      </button>

                    </div>

                    <button
                      className="remove-btn"
                      disabled={loading}
                      onClick={() =>
                        removeFromCart(item.product._id)
                      }
                    >
                      <Trash2 size={17} /> Remove
                    </button>

                  </div>
                </div>
              </div>
            ))}

          </div>

          <aside className="order-summary">

            <h2>Order Summary</h2>

            <div className="summary-line">
              <span>Subtotal</span>

              <strong>
                ${subtotal.toFixed(2)}
              </strong>
            </div>

            <div className="summary-line">
              <span>Shipping</span>
              <span>Free</span>
            </div>

            <hr />

            <div className="summary-line total">
              <span>Total</span>

              <strong>
                ${subtotal.toFixed(2)}
              </strong>
            </div>

            <div style={{ marginTop: "25px" }}>

              <label
                htmlFor="shippingAddress"
                style={{
                  display: "block",
                  fontWeight: 600,
                  marginBottom: "10px"
                }}
              >
                Shipping Address
              </label>

              <textarea
                id="shippingAddress"
                value={shippingAddress}
                disabled={loading}
                onChange={event =>
                  setShippingAddress(event.target.value)
                }
                placeholder="Enter your complete delivery address"
                rows={4}
                maxLength={500}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "12px",
                  border: "1px solid #ccc",
                  borderRadius: "6px",
                  resize: "vertical",
                  fontFamily: "inherit",
                  fontSize: "14px"
                }}
              />

            </div>

            {error && (
              <p
                role="alert"
                style={{
                  background: "#fee2e2",
                  color: "#b91c1c",
                  padding: "12px",
                  borderRadius: "6px",
                  marginTop: "15px"
                }}
              >
                {error}
              </p>
            )}

            <button
              className="btn btn-dark full-width"
              onClick={placeOrder}
              disabled={loading}
              style={{
                marginTop: "20px",
                opacity: loading ? 0.6 : 1,
                cursor: loading
                  ? "not-allowed"
                  : "pointer"
              }}
            >
              <ShoppingBag size={18} />

              {loading
                ? "PLACING ORDER..."
                : "PLACE ORDER"}

            </button>

            <Link
              to="/shop"
              className="btn btn-dark full-width"
              style={{ marginTop: "12px" }}
            >
              CONTINUE SHOPPING
              <ArrowRight size={18} />
            </Link>

            <p
              className="muted"
              style={{ marginTop: "15px" }}
            >
              Secure checkout. Your order will be
              submitted to shopSquare. No online
              payment is collected.
            </p>

          </aside>

        </div>
      )}

    </div>
  );
}