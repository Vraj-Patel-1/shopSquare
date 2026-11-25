import type { Product } from "../App";

// Strategy interface
export interface ProductSortStrategy {
  sort(products: Product[]): Product[];
}

// Default sorting strategy
export class DefaultSort implements ProductSortStrategy {
  sort(products: Product[]): Product[] {
    return [...products];
  }
}

// Price: Low to High
export class PriceLowToHigh implements ProductSortStrategy {
  sort(products: Product[]): Product[] {
    return [...products].sort(
      (a, b) => a.price - b.price
    );
  }
}

// Price: High to Low
export class PriceHighToLow implements ProductSortStrategy {
  sort(products: Product[]): Product[] {
    return [...products].sort(
      (a, b) => b.price - a.price
    );
  }
}

// Name: A to Z
export class NameAscending implements ProductSortStrategy {
  sort(products: Product[]): Product[] {
    return [...products].sort(
      (a, b) => a.name.localeCompare(b.name)
    );
  }
}

// Name: Z to A
export class NameDescending implements ProductSortStrategy {
  sort(products: Product[]): Product[] {
    return [...products].sort(
      (a, b) => b.name.localeCompare(a.name)
    );
  }
}

// Available sorting strategies
export const sortStrategies = {
  default: new DefaultSort(),
  priceLow: new PriceLowToHigh(),
  priceHigh: new PriceHighToLow(),
  nameAsc: new NameAscending(),
  nameDesc: new NameDescending()
};

export type SortOption = keyof typeof sortStrategies;