import {
  BrowserRouter,
  Link,
  NavLink,
  Route,
  Routes,
  Navigate,
  useLocation,
  useNavigate
} from "react-router-dom";

import {
  ShoppingBag,
  UserRound,
  Store,
  LogOut
} from "lucide-react";

import {
  createContext,
  useContext,
  useEffect,
  useState
} from "react";

import type { ReactNode } from "react";

import Home from "./pages/Home";
import Shop from "./pages/Shop";
import ProductDetails from "./pages/ProductDetails";
import Cart from "./pages/Cart";
import Login from "./pages/Login";
import Orders from "./pages/Orders";
import AdminProducts from "./pages/AdminProducts";

import "./App.css";

// ==========================================
// PRODUCT TYPES
// ==========================================

export type Product = {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  stock: number;
};

export type CartItem = {
  product: Product;
  quantity: number;
};

type User = {
  id: string;
  name: string;
  email: string;
  role: "customer" | "admin";
};

// ==========================================
// AUTHENTICATION UTILITIES
// ==========================================

function getCurrentUser(): User | null {
  try {
    const token = sessionStorage.getItem(
      "shopSquareToken"
    );

    const user = sessionStorage.getItem(
      "shopSquareUser"
    );

    if (!token || !user) return null;

    return JSON.parse(user);

  } catch {
    return null;
  }
}

// ==========================================
// PROTECTED ROUTE
// ==========================================

function ProtectedRoute({
  children
}: {
  children: ReactNode;
}) {
  const user = getCurrentUser();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// ==========================================
// ADMIN PROTECTED ROUTE
// ==========================================

function AdminRoute({
  children
}: {
  children: ReactNode;
}) {
  const user = getCurrentUser();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

// ==========================================
// CART CONTEXT
// ==========================================

type CartContextType = {
  cart: CartItem[];
  addToCart: (
    product: Product,
    quantity?: number
  ) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (
    id: string,
    quantity: number
  ) => void;
  clearCart: () => void;
};

const CartContext =
  createContext<CartContextType | null>(null);

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("Cart provider missing");
  }

  return context;
}

// ==========================================
// CART PROVIDER
// ==========================================

function CartProvider({
  children
}: {
  children: ReactNode;
}) {
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      return JSON.parse(
        localStorage.getItem("shopSquareCart") || "[]"
      );
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(
      "shopSquareCart",
      JSON.stringify(cart)
    );
  }, [cart]);

  function addToCart(
    product: Product,
    quantity = 1
  ) {
    if (product.stock <= 0) return;

    setCart(previous => {
      const existing = previous.find(
        item => item.product._id === product._id
      );

      if (existing) {
        return previous.map(item =>
          item.product._id === product._id
            ? {
                ...item,
                quantity: Math.min(
                  item.quantity + quantity,
                  product.stock
                )
              }
            : item
        );
      }

      return [
        ...previous,
        {
          product,
          quantity: Math.min(
            quantity,
            product.stock
          )
        }
      ];
    });
  }

  function removeFromCart(id: string) {
    setCart(previous =>
      previous.filter(
        item => item.product._id !== id
      )
    );
  }

  function updateQuantity(
    id: string,
    quantity: number
  ) {
    setCart(previous =>
      previous.map(item =>
        item.product._id === id
          ? {
              ...item,
              quantity: Math.max(
                1,
                Math.min(
                  quantity,
                  item.product.stock
                )
              )
            }
          : item
      )
    );
  }

  function clearCart() {
    setCart([]);
  }

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

// ==========================================
// PRODUCT IMAGE
// ==========================================

export function ProductImage({
  product
}: {
  product: Product;
}) {
  return product.image ? (
    <img
      src={product.image}
      alt={product.name}
    />
  ) : (
    <div className="image-placeholder">
      <ShoppingBag size={46} />
      <span>shopSquare</span>
    </div>
  );
}

// ==========================================
// HEADER
// ==========================================

function Header() {
  const { cart, clearCart } = useCart();

  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState<User | null>(
    getCurrentUser
  );

  useEffect(() => {
    setUser(getCurrentUser());
  }, [location]);

  const count = cart.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  function handleLogout() {
    sessionStorage.removeItem("shopSquareToken");
    sessionStorage.removeItem("shopSquareUser");

    setUser(null);
    clearCart();

    navigate("/login", { replace: true });
  }

  return (
    <>
      <div className="announcement">
        NEW SEASON COLLECTION — DISCOVER YOUR STYLE
      </div>

      <header className="header">

        <Link to="/" className="logo">
          <Store size={25} />
          shop<span>Square</span>
        </Link>

        <nav>
          <NavLink to="/">Home</NavLink>

          <NavLink to="/shop">Shop</NavLink>

          <NavLink to="/cart">Cart</NavLink>

          {user && (
            <NavLink to="/orders">
              {user.role === "admin"
                ? "All Orders"
                : "My Orders"}
            </NavLink>
          )}

          {user?.role === "admin" && (
            <NavLink to="/admin/products">
              Manage Products
            </NavLink>
          )}
        </nav>

        <div className="header-actions">

          {user ? (
            <>
              <span
                style={{
                  fontSize: "13px",
                  fontWeight: 600
                }}
              >
                {user.name}

                {user.role === "admin" && (
                  <small
                    style={{
                      display: "block",
                      color: "#777",
                      fontSize: "10px"
                    }}
                  >
                    ADMINISTRATOR
                  </small>
                )}
              </span>

              <button
                type="button"
                onClick={handleLogout}
                aria-label="Logout"
                title="Logout"
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center"
                }}
              >
                <LogOut size={21} />
              </button>
            </>
          ) : (
            <Link
              to="/login"
              aria-label="Login"
            >
              <UserRound size={22} />
            </Link>
          )}

          <Link
            to="/cart"
            className="cart-icon"
            aria-label="Cart"
          >
            <ShoppingBag size={22} />

            {count > 0 && (
              <span className="cart-count">
                {count}
              </span>
            )}
          </Link>

        </div>
      </header>
    </>
  );
}

// ==========================================
// FOOTER
// ==========================================

function Footer() {
  return (
    <footer className="footer">

      <div>
        <h2>shopSquare.</h2>

        <p>
          Modern essentials. Everyday confidence.
        </p>
      </div>

      <p>
        © {new Date().getFullYear()} shopSquare.
        All rights reserved.
      </p>

    </footer>
  );
}

// ==========================================
// APPLICATION ROUTES
// ==========================================

export default function App() {
  return (
    <CartProvider>
      <BrowserRouter>

        <Header />

        <main>
          <Routes>

            <Route
              path="/"
              element={<Home />}
            />

            <Route
              path="/shop"
              element={<Shop />}
            />

            <Route
              path="/product/:id"
              element={<ProductDetails />}
            />

            <Route
              path="/cart"
              element={<Cart />}
            />

            <Route
              path="/login"
              element={<Login />}
            />

            <Route
              path="/orders"
              element={
                <ProtectedRoute>
                  <Orders />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/products"
              element={
                <AdminRoute>
                  <AdminProducts />
                </AdminRoute>
              }
            />

            <Route
              path="*"
              element={<Navigate to="/" replace />}
            />

          </Routes>
        </main>

        <Footer />

      </BrowserRouter>
    </CartProvider>
  );
}