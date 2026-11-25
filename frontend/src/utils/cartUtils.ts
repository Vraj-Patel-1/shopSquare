export interface CartItem {
  product: {
    price: number;
  };
  quantity: number;
}

// Calculate cart subtotal
export function calculateSubtotal(items: CartItem[]): number {
  const totalCents = items.reduce(
    (total, item) =>
      total + Math.round(item.product.price * 100) * item.quantity,
    0
  );

  return totalCents / 100;
}

// Validate product quantity
export function isValidQuantity(quantity: number): boolean {
  return Number.isInteger(quantity) && quantity > 0;
}

// Check stock availability
export function hasEnoughStock(
  quantity: number,
  stock: number
): boolean {
  return isValidQuantity(quantity) && quantity <= stock;
}
