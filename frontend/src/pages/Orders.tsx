import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Package, ArrowRight, Trash2, Bell } from "lucide-react";

interface OrderItem {
  _id: string;
  product: string;
  name: string;
  price: number;
  quantity: number;
}

interface Order {
  _id: string;
  customer?: {
    _id: string;
    name: string;
    email: string;
  };
  items: OrderItem[];
  totalAmount: number;
  shippingAddress: string;
  status: string;
  createdAt: string;
}

const API = "http://localhost:5000/api/orders";

const NOTIFICATION_API = "http://localhost:5000/api/notifications";

function decodeVapidKey(key: string): Uint8Array<ArrayBuffer> {
  const padded = key + "=".repeat((4 - key.length % 4) % 4);
  const raw = atob(padded.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, char => char.charCodeAt(0));
}

const statuses = [
  "Pending",
  "Confirmed",
  "Shipped",
  "Delivered",
  "Cancelled"
];

export default function Orders() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const [selectedStatuses, setSelectedStatuses] =
    useState<Record<string, string>>({});

  const [notificationBusy, setNotificationBusy] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");

  let isAdmin = false;

  try {
    const user = JSON.parse(
      sessionStorage.getItem("shopSquareUser") || "null"
    );

    isAdmin = user?.role === "admin";
  } catch {
    isAdmin = false;
  }

  async function request(path = "", options: RequestInit = {}) {
    const token = sessionStorage.getItem("shopSquareToken");

    if (!token) {
      navigate("/login");
      throw new Error("Please sign in.");
    }

    const response = await fetch(`${API}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (response.status === 401) {
      sessionStorage.removeItem("shopSquareToken");
      sessionStorage.removeItem("shopSquareUser");
      navigate("/login");
      throw new Error("Session expired.");
    }

    if (!response.ok) {
      throw new Error(data.message || "Request failed.");
    }

    return data;
  }

  useEffect(() => {
    async function loadOrders() {
      try {
        const data = await request();
        setOrders(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load orders."
        );
      } finally {
        setLoading(false);
      }
    }

    loadOrders();
  }, [navigate]);

  async function notificationRequest(path: string, body: unknown) {
    const token = sessionStorage.getItem("shopSquareToken");
    if (!token) throw new Error("Please sign in again.");
    const response = await fetch(`${NOTIFICATION_API}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(body)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Notification request failed.");
    return data;
  }

  async function enableNotifications() {
    setNotificationBusy(true);
    setNotificationMessage("");
    try {
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
        throw new Error("Push notifications are not supported in this browser.");
      }
      if (!sessionStorage.getItem("shopSquareToken")) throw new Error("Please sign in first.");
      const permission = await Notification.requestPermission();
      if (permission !== "granted") throw new Error("Notification permission was not granted.");
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration?.active) throw new Error("Service worker is not active. Open the PWA preview and refresh.");
      const response = await fetch(`${NOTIFICATION_API}/public-key`);
      if (!response.ok) throw new Error("Could not retrieve the public key.");
      const { publicKey } = await response.json();
      if (!publicKey) throw new Error("Public key is missing.");
      const key = decodeVapidKey(publicKey);
      let subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        const oldKey = subscription.options.applicationServerKey;
        if (!oldKey || new Uint8Array(oldKey).toString() !== key.toString()) {
          await subscription.unsubscribe();
          subscription = null;
        }
      }
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: key
        });
      }
      await notificationRequest("/subscribe", subscription.toJSON());
      setNotificationsEnabled(true);
      setNotificationMessage("Notifications enabled successfully.");
    } catch (err) {
      setNotificationMessage(err instanceof Error ? err.message : "Could not enable notifications.");
    } finally {
      setNotificationBusy(false);
    }
  }

  async function disableNotifications() {
    setNotificationBusy(true);
    setNotificationMessage("");
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      const subscription = await registration?.pushManager.getSubscription();
      if (subscription) {
        await notificationRequest("/unsubscribe", { endpoint: subscription.endpoint });
        await subscription.unsubscribe();
      }
      setNotificationsEnabled(false);
      setNotificationMessage("Notifications disabled on this browser.");
    } catch (err) {
      setNotificationMessage(err instanceof Error ? err.message : "Could not disable notifications.");
    } finally {
      setNotificationBusy(false);
    }
  }

  async function updateStatus(order: Order) {
    if (!isAdmin || busy) return;

    setError("");
    setSuccess("");
    setBusy(order._id);

    try {
      const status =
        selectedStatuses[order._id] || order.status;

      const updated = await request(`/${order._id}`, {
        method: "PUT",
        body: JSON.stringify({ status })
      });

      setOrders(previous =>
        previous.map(item =>
          item._id === order._id
            ? { ...item, status: updated.status }
            : item
        )
      );

      setSuccess("Order status updated successfully.");

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update order."
      );
    } finally {
      setBusy(null);
    }
  }

  async function deleteOrder(id: string) {
    if (!isAdmin || busy) return;

    const confirmed = window.confirm(
      "Are you sure you want to permanently delete this order?"
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");
    setBusy(id);

    try {
      await request(`/${id}`, {
        method: "DELETE"
      });

      setOrders(previous =>
        previous.filter(order => order._id !== id)
      );

      setSuccess("Order deleted successfully.");

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to delete order."
      );
    } finally {
      setBusy(null);
    }
  }

  function statusColor(status: string) {
    switch (status) {
      case "Confirmed":
        return "#2563eb";
      case "Shipped":
        return "#7c3aed";
      case "Delivered":
        return "#15803d";
      case "Cancelled":
        return "#dc2626";
      default:
        return "#b45309";
    }
  }

  return (
    <div className="page-container">

      <div className="page-heading">
        <span className="eyebrow dark">
          {isAdmin ? "ADMINISTRATOR PANEL" : "YOUR PURCHASES"}
        </span>

        <h1>
          {isAdmin ? "Manage Orders" : "My Orders"}
          <span className="dot">.</span>
        </h1>

        <p>
          {isAdmin
            ? "Manage customer orders and delivery status."
            : "View your orders and track their status."}
        </p>
      </div>

      {!isAdmin && (
        <div style={{ marginBottom: "24px" }}>
          <button className="btn btn-dark" disabled={notificationBusy} onClick={enableNotifications}>
            <Bell size={18} /> {notificationBusy ? "Please wait..." : notificationsEnabled ? "Notifications enabled" : "Enable Notifications"}
          </button>
          <button className="btn" disabled={notificationBusy} onClick={disableNotifications} style={{ marginLeft: "10px" }}>
            Disable Notifications
          </button>
          {notificationMessage && <p role="status" style={{ marginTop: "12px" }}>{notificationMessage}</p>}
        </div>
      )}

      {loading && <p>Loading orders...</p>}

      {error && (
        <p role="alert" style={{
          background: "#fee2e2",
          color: "#b91c1c",
          padding: "15px",
          marginBottom: "20px"
        }}>
          {error}
        </p>
      )}

      {success && (
        <p role="status" style={{
          background: "#dcfce7",
          color: "#166534",
          padding: "15px",
          marginBottom: "20px"
        }}>
          {success}
        </p>
      )}

      {!loading && !error && orders.length === 0 && (
        <div className="empty-state">
          <Package size={45} />
          <h2>No orders yet</h2>
          <p>Orders will appear here.</p>

          <Link to="/shop" className="btn btn-dark">
            START SHOPPING <ArrowRight size={18} />
          </Link>
        </div>
      )}

      <div style={{ display: "grid", gap: "24px" }}>

        {orders.map(order => (
          <article
            key={order._id}
            style={{
              border: "1px solid #ddd",
              padding: "25px",
              borderRadius: "8px"
            }}
          >

            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "15px"
            }}>

              <div>
                <h3>
                  Order #{order._id.slice(-8).toUpperCase()}
                </h3>

                <p className="muted">
                  {new Date(order.createdAt)
                    .toLocaleDateString("en-NZ")}
                </p>

                {isAdmin && order.customer && (
                  <div>
                    <strong>{order.customer.name}</strong>
                    <p className="muted">
                      {order.customer.email}
                    </p>
                  </div>
                )}
              </div>

              <span style={{
                color: statusColor(order.status),
                fontWeight: 700,
                background: "#f5f5f5",
                padding: "8px 16px",
                borderRadius: "20px"
              }}>
                {order.status}
              </span>

            </div>

            <hr style={{ margin: "20px 0" }} />

            {order.items.map(item => (
              <div
                key={item._id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "15px",
                  padding: "12px 0"
                }}
              >
                <div>
                  <strong>{item.name}</strong>

                  <p className="muted">
                    Quantity: {item.quantity}
                  </p>
                </div>

                <strong>
                  ${(item.price * item.quantity).toFixed(2)}
                </strong>
              </div>
            ))}

            <hr style={{ margin: "20px 0" }} />

            <strong>Shipping address:</strong>

            <p className="muted">
              {order.shippingAddress}
            </p>

            <div style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: "20px",
              fontSize: "20px",
              fontWeight: 700
            }}>
              <span>Total Amount</span>
              <span>${order.totalAmount.toFixed(2)}</span>
            </div>

            {isAdmin && (
              <div style={{
                marginTop: "25px",
                background: "#f5f5f5",
                padding: "20px",
                borderRadius: "8px"
              }}>

                <h3>Manage Order</h3>

                <label htmlFor={`status-${order._id}`}>
                  Order Status
                </label>

                <select
                  id={`status-${order._id}`}
                  disabled={busy !== null}
                  value={
                    selectedStatuses[order._id] ||
                    order.status
                  }
                  onChange={event =>
                    setSelectedStatuses(previous => ({
                      ...previous,
                      [order._id]: event.target.value
                    }))
                  }
                  style={{
                    display: "block",
                    width: "100%",
                    padding: "12px",
                    marginTop: "10px",
                    marginBottom: "15px",
                    border: "1px solid #ccc",
                    borderRadius: "5px"
                  }}
                >
                  {statuses.map(status => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>

                <div style={{
                  display: "flex",
                  gap: "12px",
                  flexWrap: "wrap"
                }}>

                  <button
                    className="btn btn-dark"
                    disabled={busy !== null}
                    onClick={() => updateStatus(order)}
                  >
                    UPDATE STATUS
                  </button>

                  <button
                    disabled={busy !== null}
                    onClick={() => deleteOrder(order._id)}
                    style={{
                      background: "#dc2626",
                      color: "white",
                      border: "none",
                      padding: "12px 20px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px"
                    }}
                  >
                    <Trash2 size={17} />
                    DELETE ORDER
                  </button>

                </div>
              </div>
            )}

          </article>
        ))}

      </div>
    </div>
  );
}