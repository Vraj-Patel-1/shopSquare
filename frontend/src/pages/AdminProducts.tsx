import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Pencil, Trash2, Package } from "lucide-react";
import { ProductImage } from "../App";
import type { Product } from "../App";

const API = "http://localhost:5000/api/products";

const emptyForm = {
  name: "",
  description: "",
  price: "",
  category: "",
  image: "",
  stock: ""
};

export default function AdminProducts() {
  const navigate = useNavigate();

  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function isAdmin() {
    try {
      const user = JSON.parse(
        sessionStorage.getItem("shopSquareUser") || "null"
      );

      return (
        user?.role === "admin" &&
        !!sessionStorage.getItem("shopSquareToken")
      );
    } catch {
      return false;
    }
  }

  async function request(
    path = "",
    options: RequestInit = {}
  ) {
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

  // READ PRODUCTS
  useEffect(() => {
    if (!isAdmin()) {
      navigate("/");
      return;
    }

    async function loadProducts() {
      try {
        const data = await request();
        setProducts(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load products."
        );
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, [navigate]);

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  // CREATE AND UPDATE PRODUCTS
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isAdmin() || busy) return;

    setError("");
    setSuccess("");

    const price = Number(form.price);
    const stock = Number(form.stock);

    if (
      !form.name.trim() ||
      !form.description.trim() ||
      !form.category.trim() ||
      !form.price.trim() ||
      !form.stock.trim() ||
      !Number.isFinite(price) ||
      price < 0 ||
      !Number.isInteger(stock) ||
      stock < 0
    ) {
      setError("Please enter valid product information.");
      return;
    }

    setBusy(true);

    const productData = {
      name: form.name.trim(),
      description: form.description.trim(),
      category: form.category.trim(),
      image: form.image.trim(),
      price,
      stock
    };

    try {
      if (editingId) {
        const updated = await request(`/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(productData)
        });

        setProducts(previous =>
          previous.map(product =>
            product._id === editingId
              ? updated
              : product
          )
        );

        setSuccess("Product updated successfully.");
      } else {
        const created = await request("", {
          method: "POST",
          body: JSON.stringify(productData)
        });

        setProducts(previous => [...previous, created]);

        setSuccess("Product created successfully.");
      }

      resetForm();

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to save product."
      );
    } finally {
      setBusy(false);
    }
  }

  // LOAD PRODUCT INTO EDIT FORM
  function editProduct(product: Product) {
    setEditingId(product._id);

    setForm({
      name: product.name,
      description: product.description,
      price: String(product.price),
      category: product.category,
      image: product.image || "",
      stock: String(product.stock)
    });

    setError("");
    setSuccess("");

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }

  // DELETE PRODUCT
  async function deleteProduct(id: string) {
    if (!isAdmin() || busy) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this product?"
    );

    if (!confirmed) return;

    setBusy(true);
    setError("");
    setSuccess("");

    try {
      await request(`/${id}`, {
        method: "DELETE"
      });

      setProducts(previous =>
        previous.filter(product => product._id !== id)
      );

      if (editingId === id) {
        resetForm();
      }

      setSuccess("Product deleted successfully.");

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to delete product."
      );
    } finally {
      setBusy(false);
    }
  }

  if (!isAdmin()) return null;

  const inputStyle = {
    width: "100%",
    padding: "13px",
    border: "1px solid #ccc",
    borderRadius: "5px",
    marginTop: "8px",
    marginBottom: "18px",
    boxSizing: "border-box" as const
  };

  return (
    <div className="page-container">

      <div className="page-heading">
        <span className="eyebrow dark">
          ADMINISTRATOR PANEL
        </span>

        <h1>
          Manage Products<span className="dot">.</span>
        </h1>

        <p>
          Create, update and manage your clothing inventory.
        </p>
      </div>

      {error && (
        <p role="alert" style={{
          background: "#fee2e2",
          color: "#b91c1c",
          padding: "15px"
        }}>
          {error}
        </p>
      )}

      {success && (
        <p role="status" style={{
          background: "#dcfce7",
          color: "#166534",
          padding: "15px"
        }}>
          {success}
        </p>
      )}

      {/* PRODUCT FORM */}

      <section style={{
        background: "#f5f5f5",
        padding: "30px",
        borderRadius: "8px",
        marginBottom: "40px"
      }}>

        <h2>
          {editingId ? "Edit Product" : "Add New Product"}
        </h2>

        <form onSubmit={handleSubmit}>

          <label>
            Product Name
            <input
              style={inputStyle}
              required
              value={form.name}
              placeholder="Oversized Black T-Shirt"
              onChange={e =>
                setForm({ ...form, name: e.target.value })
              }
            />
          </label>

          <label>
            Description
            <textarea
              style={inputStyle}
              required
              rows={3}
              value={form.description}
              placeholder="Enter product description"
              onChange={e =>
                setForm({
                  ...form,
                  description: e.target.value
                })
              }
            />
          </label>

          <div style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "20px"
          }}>

            <label>
              Price ($)
              <input
                style={inputStyle}
                type="number"
                min="0"
                step="0.01"
                required
                value={form.price}
                onChange={e =>
                  setForm({ ...form, price: e.target.value })
                }
              />
            </label>

            <label>
              Stock Quantity
              <input
                style={inputStyle}
                type="number"
                min="0"
                step="1"
                required
                value={form.stock}
                onChange={e =>
                  setForm({ ...form, stock: e.target.value })
                }
              />
            </label>

          </div>

          <label>
            Category
            <select
              style={inputStyle}
              required
              value={form.category}
              onChange={e =>
                setForm({ ...form, category: e.target.value })
              }
            >
              <option value="">Select Category</option>
              <option value="T-Shirts">T-Shirts</option>
              <option value="Hoodies">Hoodies</option>
              <option value="Pants">Pants</option>
              <option value="Jackets">Jackets</option>
              <option value="Accessories">Accessories</option>
            </select>
          </label>

          <label>
            Product Image URL
            <input
              style={inputStyle}
              type="url"
              value={form.image}
              placeholder="https://example.com/image.jpg"
              onChange={e =>
                setForm({ ...form, image: e.target.value })
              }
            />
          </label>

          <div style={{
            display: "flex",
            gap: "15px",
            flexWrap: "wrap"
          }}>

            <button
              type="submit"
              className="btn btn-dark"
              disabled={busy}
            >
              {editingId
                ? <Pencil size={18} />
                : <Plus size={18} />}

              {busy
                ? "PLEASE WAIT..."
                : editingId
                  ? "UPDATE PRODUCT"
                  : "ADD PRODUCT"}
            </button>

            {editingId && (
              <button
                type="button"
                className="btn btn-dark"
                disabled={busy}
                onClick={resetForm}
              >
                CANCEL EDIT
              </button>
            )}

          </div>
        </form>
      </section>

      {/* PRODUCT LIST */}

      <h2>Product Inventory ({products.length})</h2>

      {loading && <p>Loading products...</p>}

      {!loading && products.length === 0 && !error && (
        <div className="empty-state">
          <Package size={45} />
          <h2>No products available</h2>
          <p>Add your first product using the form above.</p>
        </div>
      )}

      <div style={{
        display: "grid",
        gridTemplateColumns:
          "repeat(auto-fit, minmax(250px, 1fr))",
        gap: "25px",
        marginTop: "25px"
      }}>

        {products.map(product => (
          <article
            key={product._id}
            style={{
              border: "1px solid #ddd",
              borderRadius: "8px",
              overflow: "hidden"
            }}
          >

            <div style={{
              height: "220px",
              overflow: "hidden",
              background: "#eee"
            }}>
              <ProductImage product={product} />
            </div>

            <div style={{ padding: "20px" }}>

              <span className="product-category">
                {product.category}
              </span>

              <h3>{product.name}</h3>

              <p className="muted">
                {product.description}
              </p>

              <h3>${product.price.toFixed(2)}</h3>

              <p style={{
                color: product.stock > 0
                  ? "#15803d"
                  : "#dc2626",
                fontWeight: 600
              }}>
                Stock: {product.stock}
              </p>

              <div style={{
                display: "flex",
                gap: "10px",
                marginTop: "20px",
                flexWrap: "wrap"
              }}>

                <button
                  className="btn btn-dark"
                  disabled={busy}
                  onClick={() => editProduct(product)}
                >
                  <Pencil size={16} /> EDIT
                </button>

                <button
                  disabled={busy}
                  onClick={() => deleteProduct(product._id)}
                  style={{
                    background: "#dc2626",
                    color: "white",
                    border: "none",
                    padding: "12px 18px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px"
                  }}
                >
                  <Trash2 size={16} /> DELETE
                </button>

              </div>
            </div>
          </article>
        ))}

      </div>
    </div>
  );
}