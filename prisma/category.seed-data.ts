export const CATEGORY_SEED = [
  {
    slug: 'residential',
    name: 'Residential',
    description: 'Residential Properties',
    sortOrder: 1,
    children: [
      { slug: 'apartment', name: 'Apartment', sortOrder: 1 },
      { slug: 'villa', name: 'Villa', sortOrder: 2 },
      { slug: 'duplex', name: 'Duplex', sortOrder: 3 },
      { slug: 'penthouse', name: 'Penthouse', sortOrder: 4 },
      { slug: 'studio', name: 'Studio', sortOrder: 5 },
      { slug: 'townhouse', name: 'Townhouse', sortOrder: 6 },
      { slug: 'chalet', name: 'Chalet', sortOrder: 7 },
    ],
  },
  {
    slug: 'commercial',
    name: 'Commercial',
    description: 'Commercial Properties',
    sortOrder: 2,
    children: [
      { slug: 'office', name: 'Office', sortOrder: 1 },
      { slug: 'shop', name: 'Shop', sortOrder: 2 },
      { slug: 'clinic', name: 'Clinic', sortOrder: 3 },
      { slug: 'warehouse', name: 'Warehouse', sortOrder: 4 },
      { slug: 'factory', name: 'Factory', sortOrder: 5 },
    ],
  },
  {
    slug: 'land',
    name: 'Land',
    description: 'Land Properties',
    sortOrder: 3,
    children: [
      { slug: 'residential-land', name: 'Residential Land', sortOrder: 1 },
      { slug: 'commercial-land', name: 'Commercial Land', sortOrder: 2 },
      { slug: 'agricultural-land', name: 'Agricultural Land', sortOrder: 3 },
    ],
  },
] as const;
