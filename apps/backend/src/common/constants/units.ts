export const PRODUCT_UNITS = [
  // Weight
  'kg',
  'g',
  'lb',
  // Volume
  'liter',
  'ml',
  // Discrete / countable
  'piece',
  'dozen',
  'pack',
  'bunch',
  'box',
  'bag',
  'bottle',
  'jar',
  'plant',
  'seedling',
] as const;

export type ProductUnit = (typeof PRODUCT_UNITS)[number];

// Weight and volume units — inventory count is meaningless for these.
// Stock availability is managed via product.isAvailable only.
export const WEIGHT_VOLUME_UNITS = new Set<ProductUnit>([
  'kg', 'g', 'lb', 'liter', 'ml', 'bunch',
]);

// Discrete countable units — inventory quantity tracking makes sense.
export const COUNTABLE_UNITS = new Set<ProductUnit>(
  PRODUCT_UNITS.filter(u => !WEIGHT_VOLUME_UNITS.has(u as any)) as unknown as ProductUnit[]
);
