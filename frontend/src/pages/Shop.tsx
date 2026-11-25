import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search, ShoppingBag } from "lucide-react";
import { ProductImage, useCart } from "../App";
import type { Product } from "../App";

import { sortStrategies } from "../patterns/productSortStrategy";
import type { SortOption } from "../patterns/productSortStrategy";

export default function Shop() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  // Selected sorting strategy
  const [sortOption, setSortOption] =
    useState<SortOption>("default");

  const [params, setParams] = useSearchParams();
  const { addToCart } = useCart();

  const category = params.get("category") || "All";

  // Load products from backend
  useEffect(() => {
    async function loadProducts() {
      try {
        const response = await fetch(
          "http://localhost:5000/api/products"
        );

        if (!response.ok) {
          throw new Error("Failed to load products");
        }

        const data = await response.json();
        setProducts(data);

      } catch {
        setError(
          "Unable to connect to the shopSquare backend."
        );

      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, []);

  // Generate product categories
  const categories = [
    "All",
    ...new Set(products.map(product => product.category))
  ];

  // Filter products by category and search
  const filtered = products.filter(product => {
    const matchesCategory =
      category === "All" ||
      product.category === category;

    const matchesSearch = product.name
      .toLowerCase()
      .includes(search.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  // Apply the selected Strategy design pattern
  const sortedProducts =
    sortStrategies[sortOption].sort(filtered);

  return (
    <div className="page-container">

      <div className="page-heading">

        <span className="eyebrow dark">
          SHOP THE COLLECTION
        </span>

        <h1>
          All Products<span className="dot">.</span>
        </h1>

        <p>Find the pieces that define your style.</p>

      </div>

      <div className="shop-toolbar">

        {/* Category filters */}
        <div className="filter-buttons">

          {categories.map(item => (
            <button
              key={item}
              type="button"
              className={
                category === item
                  ? "filter active"
                  : "filter"
              }
              aria-pressed={category === item}
              onClick={() =>
                setParams(
                  item === "All"
                    ? {}
                    : { category: item }
                )
              }
            >
              {item}
            </button>
          ))}

        </div>

        {/* Product search */}
        <div className="search-box">

          <Search size={18} />

          <input
            placeholder="Search products..."
            aria-label="Search products"
            value={search}
            onChange={event =>
              setSearch(event.target.value)
            }
          />

        </div>

      </div>

      {/* Strategy pattern sorting selector */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          gap: "12px",
          margin: "20px 0",
          flexWrap: "wrap"
        }}
      >

        <label
          htmlFor="productSort"
          style={{
            fontWeight: 600,
            fontSize: "14px"
          }}
        >
          Sort by:
        </label>

        <select
          id="productSort"
          value={sortOption}
          onChange={event =>
            setSortOption(
              event.target.value as SortOption
            )
          }
          style={{
            padding: "12px 16px",
            border: "1px solid #ccc",
            borderRadius: "6px",
            background: "#fff",
            color: "#111",
            fontSize: "14px",
            cursor: "pointer"
          }}
        >

          <option value="default">
            Default
          </option>

          <option value="priceLow">
            Price: Low to High
          </option>

          <option value="priceHigh">
            Price: High to Low
          </option>

          <option value="nameAsc">
            Name: A to Z
          </option>

          <option value="nameDesc">
            Name: Z to A
          </option>

        </select>

      </div>

      {/* Loading and error messages */}
      {loading && <p>Loading products...</p>}

      {error && <p className="error">{error}</p>}

      {!loading && !error && (
        <>

          <p className="result-count">
            {sortedProducts.length} products found
          </p>

          <div className="product-grid">

            {sortedProducts.map(product => (
              <div
                className="product-card"
                key={product._id}
              >

                <Link
                  to={`/product/${product._id}`}
                  className="product-image"
                >
                  <ProductImage product={product} />
                </Link>

                <div className="product-info">

                  <span className="product-category">
                    {product.category}
                  </span>

                  <Link to={`/product/${product._id}`}>
                    <h3>{product.name}</h3>
                  </Link>

                  <div className="product-bottom">

                    <strong>
                      ${product.price.toFixed(2)}
                    </strong>

                    <button
                      type="button"
                      className="add-cart-btn"
                      disabled={product.stock <= 0}
                      onClick={() => addToCart(product)}
                      aria-label={`Add ${product.name} to cart`}
                    >
                      <ShoppingBag size={19} />
                    </button>

                  </div>

                  {product.stock <= 0 && (
                    <small>Out of stock</small>
                  )}

                </div>

              </div>
            ))}

          </div>

          {sortedProducts.length === 0 && (
            <div className="empty-state">
              No products found.
            </div>
          )}

        </>
      )}

    </div>
  );
}