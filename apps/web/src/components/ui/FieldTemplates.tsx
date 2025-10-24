'use client';

import { DynamicFieldConfig } from './DynamicField';

export const NATURAL_PRODUCT_FIELD_TEMPLATES: Record<string, DynamicFieldConfig[]> = {
  // Organic Products
  'organic_products': [
    {
      id: 'variety',
      name: 'variety',
      label: 'Variety',
      type: 'text',
      required: true,
      placeholder: 'e.g., Red Delicious, Granny Smith',
      description: 'The specific variety of the product',
      category: 'Basic Information'
    },
    {
      id: 'ripeness_level',
      name: 'ripeness_level',
      label: 'Ripeness Level',
      type: 'select',
      required: true,
      options: [
        { label: 'Unripe', value: 'unripe' },
        { label: 'Semi-ripe', value: 'semi_ripe' },
        { label: 'Ripe', value: 'ripe' },
        { label: 'Overripe', value: 'overripe' }
      ],
      category: 'Quality & Certification'
    },
    {
      id: 'sweetness_level',
      name: 'sweetness_level',
      label: 'Sweetness Level',
      type: 'range',
      required: false,
      min: 1,
      max: 10,
      step: 1,
      category: 'Quality & Certification'
    },
    {
      id: 'harvest_date',
      name: 'harvest_date',
      label: 'Harvest Date',
      type: 'date',
      required: false,
      category: 'Quality & Certification'
    },
    {
      id: 'shelf_life_days',
      name: 'shelf_life_days',
      label: 'Shelf Life (Days)',
      type: 'number',
      required: true,
      min: 1,
      max: 365,
      category: 'Storage & Handling'
    },
    {
      id: 'storage_temperature',
      name: 'storage_temperature',
      label: 'Storage Temperature (°C)',
      type: 'number',
      required: false,
      min: -20,
      max: 25,
      step: 0.1,
      category: 'Storage & Handling'
    }
  ],

  // Vegetables
  'vegetables': [
    {
      id: 'variety',
      name: 'variety',
      label: 'Variety',
      type: 'text',
      required: true,
      placeholder: 'e.g., Romaine, Iceberg, Baby Spinach',
      description: 'The specific variety of the vegetable',
      category: 'Basic Information'
    },
    {
      id: 'freshness_level',
      name: 'freshness_level',
      label: 'Freshness Level',
      type: 'select',
      required: true,
      options: [
        { label: 'Very Fresh', value: 'very_fresh' },
        { label: 'Fresh', value: 'fresh' },
        { label: 'Good', value: 'good' },
        { label: 'Fair', value: 'fair' }
      ],
      category: 'Quality & Certification'
    },
    {
      id: 'leaf_size',
      name: 'leaf_size',
      label: 'Leaf Size',
      type: 'select',
      required: false,
      options: [
        { label: 'Baby', value: 'baby' },
        { label: 'Small', value: 'small' },
        { label: 'Medium', value: 'medium' },
        { label: 'Large', value: 'large' }
      ],
      category: 'Physical Properties'
    },
    {
      id: 'harvest_date',
      name: 'harvest_date',
      label: 'Harvest Date',
      type: 'date',
      required: false,
      category: 'Quality & Certification'
    },
    {
      id: 'shelf_life_days',
      name: 'shelf_life_days',
      label: 'Shelf Life (Days)',
      type: 'number',
      required: true,
      min: 1,
      max: 30,
      category: 'Storage & Handling'
    },
    {
      id: 'storage_temperature',
      name: 'storage_temperature',
      label: 'Storage Temperature (°C)',
      type: 'number',
      required: false,
      min: 0,
      max: 10,
      step: 0.1,
      category: 'Storage & Handling'
    }
  ],

  // Grains & Cereals
  'grains': [
    {
      id: 'grain_type',
      name: 'grain_type',
      label: 'Grain Type',
      type: 'text',
      required: true,
      placeholder: 'e.g., Basmati, Jasmine, Brown Rice',
      category: 'Basic Information'
    },
    {
      id: 'grade',
      name: 'grade',
      label: 'Grade',
      type: 'select',
      required: true,
      options: [
        { label: 'Premium', value: 'premium' },
        { label: 'Grade A', value: 'grade_a' },
        { label: 'Grade B', value: 'grade_b' },
        { label: 'Standard', value: 'standard' }
      ],
      category: 'Quality & Certification'
    },
    {
      id: 'protein_content',
      name: 'protein_content',
      label: 'Protein Content (%)',
      type: 'number',
      required: false,
      min: 0,
      max: 100,
      step: 0.1,
      category: 'Nutritional Information'
    },
    {
      id: 'fiber_content',
      name: 'fiber_content',
      label: 'Fiber Content (%)',
      type: 'number',
      required: false,
      min: 0,
      max: 100,
      step: 0.1,
      category: 'Nutritional Information'
    },
    {
      id: 'moisture_content',
      name: 'moisture_content',
      label: 'Moisture Content (%)',
      type: 'number',
      required: false,
      min: 0,
      max: 20,
      step: 0.1,
      category: 'Quality & Certification'
    },
    {
      id: 'packaging_type',
      name: 'packaging_type',
      label: 'Packaging Type',
      type: 'select',
      required: true,
      options: [
        { label: 'Jute Bag', value: 'jute_bag' },
        { label: 'Plastic Bag', value: 'plastic_bag' },
        { label: 'Vacuum Pack', value: 'vacuum_pack' },
        { label: 'Paper Bag', value: 'paper_bag' }
      ],
      category: 'Storage & Handling'
    }
  ],

  // Nuts & Seeds
  'nuts_seeds': [
    {
      id: 'nut_type',
      name: 'nut_type',
      label: 'Nut/Seed Type',
      type: 'text',
      required: true,
      placeholder: 'e.g., Almonds, Walnuts, Chia Seeds',
      category: 'Basic Information'
    },
    {
      id: 'size',
      name: 'size',
      label: 'Size',
      type: 'select',
      required: false,
      options: [
        { label: 'Extra Large', value: 'xl' },
        { label: 'Large', value: 'large' },
        { label: 'Medium', value: 'medium' },
        { label: 'Small', value: 'small' }
      ],
      category: 'Physical Properties'
    },
    {
      id: 'shell_type',
      name: 'shell_type',
      label: 'Shell Type',
      type: 'select',
      required: false,
      options: [
        { label: 'Shelled', value: 'shelled' },
        { label: 'Unshelled', value: 'unshelled' },
        { label: 'Partially Shelled', value: 'partially_shelled' }
      ],
      category: 'Physical Properties'
    },
    {
      id: 'roast_level',
      name: 'roast_level',
      label: 'Roast Level',
      type: 'select',
      required: false,
      options: [
        { label: 'Raw', value: 'raw' },
        { label: 'Light Roast', value: 'light' },
        { label: 'Medium Roast', value: 'medium' },
        { label: 'Dark Roast', value: 'dark' }
      ],
      category: 'Quality & Certification'
    },
    {
      id: 'fat_content',
      name: 'fat_content',
      label: 'Fat Content (%)',
      type: 'number',
      required: false,
      min: 0,
      max: 100,
      step: 0.1,
      category: 'Nutritional Information'
    },
    {
      id: 'protein_content',
      name: 'protein_content',
      label: 'Protein Content (%)',
      type: 'number',
      required: false,
      min: 0,
      max: 100,
      step: 0.1,
      category: 'Nutritional Information'
    }
  ],

  // Dairy Products
  'dairy': [
    {
      id: 'milk_type',
      name: 'milk_type',
      label: 'Milk Type',
      type: 'select',
      required: true,
      options: [
        { label: 'Cow Milk', value: 'cow' },
        { label: 'Goat Milk', value: 'goat' },
        { label: 'Buffalo Milk', value: 'buffalo' },
        { label: 'Sheep Milk', value: 'sheep' }
      ],
      category: 'Basic Information'
    },
    {
      id: 'fat_content',
      name: 'fat_content',
      label: 'Fat Content (%)',
      type: 'number',
      required: true,
      min: 0,
      max: 10,
      step: 0.1,
      category: 'Physical Properties'
    },
    {
      id: 'processing_method',
      name: 'processing_method',
      label: 'Processing Method',
      type: 'select',
      required: true,
      options: [
        { label: 'Raw/Unpasteurized', value: 'raw' },
        { label: 'Pasteurized', value: 'pasteurized' },
        { label: 'Ultra-Pasteurized', value: 'ultra_pasteurized' },
        { label: 'Homogenized', value: 'homogenized' }
      ],
      category: 'Quality & Certification'
    },
    {
      id: 'packaging_type',
      name: 'packaging_type',
      label: 'Packaging Type',
      type: 'select',
      required: true,
      options: [
        { label: 'Glass Bottle', value: 'glass_bottle' },
        { label: 'Plastic Bottle', value: 'plastic_bottle' },
        { label: 'Tetra Pak', value: 'tetra_pak' },
        { label: 'Pouch', value: 'pouch' }
      ],
      category: 'Storage & Handling'
    },
    {
      id: 'expiry_date',
      name: 'expiry_date',
      label: 'Expiry Date',
      type: 'date',
      required: true,
      category: 'Storage & Handling'
    },
    {
      id: 'storage_temperature',
      name: 'storage_temperature',
      label: 'Storage Temperature (°C)',
      type: 'number',
      required: true,
      min: 0,
      max: 10,
      step: 0.1,
      category: 'Storage & Handling'
    }
  ],

  // Meat & Poultry
  'meat_poultry': [
    {
      id: 'animal_type',
      name: 'animal_type',
      label: 'Animal Type',
      type: 'select',
      required: true,
      options: [
        { label: 'Chicken', value: 'chicken' },
        { label: 'Beef', value: 'beef' },
        { label: 'Lamb', value: 'lamb' },
        { label: 'Goat', value: 'goat' },
        { label: 'Fish', value: 'fish' }
      ],
      category: 'Basic Information'
    },
    {
      id: 'cut_type',
      name: 'cut_type',
      label: 'Cut Type',
      type: 'text',
      required: true,
      placeholder: 'e.g., Breast, Thigh, Whole Chicken',
      category: 'Basic Information'
    },
    {
      id: 'weight_range',
      name: 'weight_range',
      label: 'Weight Range (kg)',
      type: 'text',
      required: false,
      placeholder: 'e.g., 1.5-2.0',
      category: 'Physical Properties'
    },
    {
      id: 'freshness_level',
      name: 'freshness_level',
      label: 'Freshness Level',
      type: 'select',
      required: true,
      options: [
        { label: 'Very Fresh', value: 'very_fresh' },
        { label: 'Fresh', value: 'fresh' },
        { label: 'Good', value: 'good' }
      ],
      category: 'Quality & Certification'
    },
    {
      id: 'slaughter_date',
      name: 'slaughter_date',
      label: 'Slaughter Date',
      type: 'date',
      required: false,
      category: 'Quality & Certification'
    },
    {
      id: 'storage_temperature',
      name: 'storage_temperature',
      label: 'Storage Temperature (°C)',
      type: 'number',
      required: true,
      min: -20,
      max: 4,
      step: 0.1,
      category: 'Storage & Handling'
    }
  ],

  // Herbs & Spices
  'herbs_spices': [
    {
      id: 'herb_spice_name',
      name: 'herb_spice_name',
      label: 'Herb/Spice Name',
      type: 'text',
      required: true,
      placeholder: 'e.g., Basil, Turmeric, Cinnamon',
      category: 'Basic Information'
    },
    {
      id: 'form',
      name: 'form',
      label: 'Form',
      type: 'select',
      required: true,
      options: [
        { label: 'Fresh', value: 'fresh' },
        { label: 'Dried', value: 'dried' },
        { label: 'Powdered', value: 'powdered' },
        { label: 'Whole', value: 'whole' },
        { label: 'Ground', value: 'ground' }
      ],
      category: 'Physical Properties'
    },
    {
      id: 'origin_country',
      name: 'origin_country',
      label: 'Origin Country',
      type: 'text',
      required: false,
      placeholder: 'e.g., India, Turkey, Sri Lanka',
      category: 'Quality & Certification'
    },
    {
      id: 'potency_level',
      name: 'potency_level',
      label: 'Potency Level',
      type: 'range',
      required: false,
      min: 1,
      max: 10,
      step: 1,
      category: 'Quality & Certification'
    },
    {
      id: 'harvest_season',
      name: 'harvest_season',
      label: 'Harvest Season',
      type: 'select',
      required: false,
      options: [
        { label: 'Spring', value: 'spring' },
        { label: 'Summer', value: 'summer' },
        { label: 'Autumn', value: 'autumn' },
        { label: 'Winter', value: 'winter' }
      ],
      category: 'Quality & Certification'
    },
    {
      id: 'shelf_life_months',
      name: 'shelf_life_months',
      label: 'Shelf Life (Months)',
      type: 'number',
      required: true,
      min: 1,
      max: 60,
      category: 'Storage & Handling'
    }
  ]
};

export const COMMON_FIELDS: DynamicFieldConfig[] = [
  // Note: Product Name, Description, Price, Unit, Images, and Availability are already included as Essential Fields
  // These are additional common fields that can be added as custom fields
  {
    id: 'weight',
    name: 'weight',
    label: 'Weight (kg)',
    type: 'number',
    required: false,
    min: 0,
    step: 0.001,
    category: 'Physical Properties'
  },
  {
    id: 'dimensions',
    name: 'dimensions',
    label: 'Dimensions (L x W x H cm)',
    type: 'text',
    required: false,
    placeholder: 'e.g., 10 x 5 x 3',
    category: 'Physical Properties'
  },
  {
    id: 'color',
    name: 'color',
    label: 'Color',
    type: 'text',
    required: false,
    placeholder: 'e.g., Red, Green, Mixed',
    category: 'Physical Properties'
  },
  {
    id: 'is_organic',
    name: 'is_organic',
    label: 'Organic Product',
    type: 'checkbox',
    required: false,
    category: 'Quality & Certification'
  },
  {
    id: 'certification',
    name: 'certification',
    label: 'Certification',
    type: 'multiselect',
    required: false,
    options: [
      { label: 'USDA Organic', value: 'usda_organic' },
      { label: 'EU Organic', value: 'eu_organic' },
      { label: 'Fair Trade', value: 'fair_trade' },
      { label: 'Non-GMO', value: 'non_gmo' },
      { label: 'Halal', value: 'halal' },
      { label: 'Kosher', value: 'kosher' }
    ],
    category: 'Quality & Certification'
  },
  {
    id: 'origin_country',
    name: 'origin_country',
    label: 'Origin Country',
    type: 'text',
    required: false,
    placeholder: 'e.g., Pakistan, India, Turkey',
    category: 'Quality & Certification'
  },
  {
    id: 'calories_per_100g',
    name: 'calories_per_100g',
    label: 'Calories per 100g',
    type: 'number',
    required: false,
    min: 0,
    step: 0.1,
    category: 'Nutritional Information'
  },
  {
    id: 'protein_per_100g',
    name: 'protein_per_100g',
    label: 'Protein per 100g (g)',
    type: 'number',
    required: false,
    min: 0,
    step: 0.1,
    category: 'Nutritional Information'
  },
  {
    id: 'carbs_per_100g',
    name: 'carbs_per_100g',
    label: 'Carbohydrates per 100g (g)',
    type: 'number',
    required: false,
    min: 0,
    step: 0.1,
    category: 'Nutritional Information'
  },
  {
    id: 'fiber_per_100g',
    name: 'fiber_per_100g',
    label: 'Fiber per 100g (g)',
    type: 'number',
    required: false,
    min: 0,
    step: 0.1,
    category: 'Nutritional Information'
  },
  {
    id: 'vitamins',
    name: 'vitamins',
    label: 'Vitamins',
    type: 'multiselect',
    required: false,
    options: [
      { label: 'Vitamin A', value: 'vitamin_a' },
      { label: 'Vitamin B', value: 'vitamin_b' },
      { label: 'Vitamin C', value: 'vitamin_c' },
      { label: 'Vitamin D', value: 'vitamin_d' },
      { label: 'Vitamin E', value: 'vitamin_e' },
      { label: 'Vitamin K', value: 'vitamin_k' }
    ],
    category: 'Nutritional Information'
  },
  {
    id: 'minerals',
    name: 'minerals',
    label: 'Minerals',
    type: 'multiselect',
    required: false,
    options: [
      { label: 'Iron', value: 'iron' },
      { label: 'Calcium', value: 'calcium' },
      { label: 'Magnesium', value: 'magnesium' },
      { label: 'Potassium', value: 'potassium' },
      { label: 'Zinc', value: 'zinc' },
      { label: 'Phosphorus', value: 'phosphorus' }
    ],
    category: 'Nutritional Information'
  },
  {
    id: 'storage_instructions',
    name: 'storage_instructions',
    label: 'Storage Instructions',
    type: 'textarea',
    required: false,
    placeholder: 'e.g., Store in cool, dry place',
    rows: 3,
    category: 'Storage & Handling'
  },
  {
    id: 'shelf_life_days',
    name: 'shelf_life_days',
    label: 'Shelf Life (Days)',
    type: 'number',
    required: false,
    min: 1,
    max: 365,
    category: 'Storage & Handling'
  },
  {
    id: 'storage_temperature',
    name: 'storage_temperature',
    label: 'Storage Temperature (°C)',
    type: 'number',
    required: false,
    min: -20,
    max: 25,
    step: 0.1,
    category: 'Storage & Handling'
  },
  {
    id: 'is_available',
    name: 'is_available',
    label: 'Available for Sale',
    type: 'checkbox',
    required: false,
    category: 'Other'
  },
  {
    id: 'featured',
    name: 'featured',
    label: 'Featured Product',
    type: 'checkbox',
    required: false,
    category: 'Other'
  }
];
