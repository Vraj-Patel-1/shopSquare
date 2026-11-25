
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ShoppingBag } from "lucide-react";
import { ProductImage, useCart } from "../App";
import type { Product } from "../App";

export default function ProductDetails() {
  const { id } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState("");
  const [added, setAdded] = useState(false);
  const { addToCart } = useCart();

  useEffect(() => {
    async function loadProduct() {
      try {
        const response = await fetch(
          `http://localhost:5000/api/products/${id}`
        );

        if (!response.ok) throw new Error("Product not found");
        setProduct(await response.json());
      } catch {
        setError("Unable to load this product.");
      }
    }

    loadProduct();
  }, [id]);

  if (error) return <div className="page-container error">{error}</div>;
  if (!product) return <div className="page-container">Loading...</div>;

  return (
    <div className="page-container">
      <Link to="/shop" className="back-link">
        <ArrowLeft size={18} /> Back to Shop
      </Link>

      <div className="details-layout">
        <div className="details-image">
          <ProductImage product={product} />
        </div>

        <div className="details-info">
          <span className="eyebrow dark">{product.category}</span>
          <h1>{product.name}</h1>
          <h2>${product.price.toFixed(2)}</h2>
          <p>{product.description}</p>

          <p className="stock-info">
            {product.stock > 0
              ? `${product.stock} items available`
              : "Out of stock"}
          </p>

          <div className="quantity-control">
            <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>
              −
            </button>
            <span>{quantity}</span>
            <button
              onClick={() => setQuantity(
                Math.min(product.stock, quantity + 1)
              )}
            >
              +
            </button>
          </div>

          <button
            className="btn btn-dark full-width"
            disabled={product.stock <= 0}
            onClick={() => {
              addToCart(product, quantity);
              setAdded(true);
            }}
          >
            <ShoppingBag size={19} /> ADD TO CART
          </button>

          {added && (
            <p className="success">
              Added to cart! <Link to="/cart">View cart</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
