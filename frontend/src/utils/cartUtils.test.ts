import { describe, it, expect } from "vitest";

import {
  calculateSubtotal,
  isValidQuantity,
  hasEnoughStock
} from "./cartUtils";

describe("shopSquare Cart Unit Tests", () => {

  it("calculates the correct cart subtotal", () => {
    const items = [
      {
        product: { price: 49.99 },
        quantity: 2
      }
    ];

    expect(calculateSubtotal(items)).toBe(99.98);
  });

  it("returns zero for an empty cart", () => {
    expect(calculateSubtotal([])).toBe(0);
  });

  it("accepts a valid quantity", () => {
    expect(isValidQuantity(2)).toBe(true);
  });

  it("rejects a negative quantity", () => {
    expect(isValidQuantity(-1)).toBe(false);
  });

  it("rejects a zero quantity", () => {
    expect(isValidQuantity(0)).toBe(false);
  });

  it("rejects a decimal quantity", () => {
    expect(isValidQuantity(1.5)).toBe(false);
  });

  it("accepts quantity within available stock", () => {
    expect(hasEnoughStock(3, 10)).toBe(true);
  });

  it("rejects quantity exceeding available stock", () => {
    expect(hasEnoughStock(15, 10)).toBe(false);
  });

});