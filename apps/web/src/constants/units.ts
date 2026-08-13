// Mirrors apps/backend/src/common/constants/units.ts
// Keep both files in sync when adding/removing units.

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

// Weight and volume units — inventory count is meaningless; use isAvailable only.
export const WEIGHT_VOLUME_UNITS = new Set<ProductUnit>([
  'kg', 'g', 'lb', 'liter', 'ml', 'bunch',
]);

// Discrete countable units — exact quantity tracking makes sense.
export const COUNTABLE_UNITS = new Set<ProductUnit>(
  PRODUCT_UNITS.filter(u => !WEIGHT_VOLUME_UNITS.has(u as any)) as unknown as ProductUnit[]
);

// Human-readable labels for UI
export const UNIT_LABELS: Record<ProductUnit, string> = {
  kg:       'Kilogram (kg)',
  g:        'Gram (g)',
  lb:       'Pound (lb)',
  liter:    'Liter',
  ml:       'Milliliter (ml)',
  piece:    'Piece',
  dozen:    'Dozen',
  pack:     'Pack',
  bunch:    'Bunch',
  box:      'Box',
  bag:      'Bag',
  bottle:   'Bottle',
  jar:      'Jar',
  plant:    'Plant',
  seedling: 'Seedling',
};
