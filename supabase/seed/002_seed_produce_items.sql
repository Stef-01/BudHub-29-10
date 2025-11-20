-- Seed Data: Indian Staple Produce Items
-- Description: Catalog of vegetables, spices, and herbs common in Indian cooking
-- Created: 2025-11-20

-- Insert produce items
INSERT INTO produce_items (
  name,
  name_variations,
  category,
  is_indian_staple,
  emoji,
  nutritional_notes,
  gi_rating
) VALUES
-- Vegetables
(
  'Bitter Melon',
  ARRAY['Karela', 'Bitter Gourd', 'Pavakkai'],
  'vegetable',
  true,
  '🥒',
  'Excellent for blood sugar control, rich in vitamins A and C. Contains compounds that help regulate glucose levels.',
  'low'
),
(
  'Okra',
  ARRAY['Bhindi', 'Lady Finger', 'Vendakkai'],
  'vegetable',
  true,
  '🫑',
  'High in fiber and vitamin C. The mucilage helps slow sugar absorption.',
  'low'
),
(
  'Bottle Gourd',
  ARRAY['Lauki', 'Doodhi', 'Sorakkai'],
  'vegetable',
  true,
  '🥒',
  'Very low in calories, high in water content. Great for hydration and weight management.',
  'low'
),
(
  'Ridge Gourd',
  ARRAY['Turai', 'Peerkangai', 'Jhinge'],
  'vegetable',
  true,
  '🥒',
  'Low calorie vegetable, good source of dietary fiber and vitamin C.',
  'low'
),
(
  'Snake Gourd',
  ARRAY['Chichinda', 'Pudalangai'],
  'vegetable',
  true,
  '🥒',
  'Low in calories, high in fiber. Helps with digestion.',
  'low'
),
(
  'Spinach',
  ARRAY['Palak', 'Keerai'],
  'vegetable',
  true,
  '🥬',
  'Rich in iron, vitamins A, C, and K. Excellent for diabetes management.',
  'low'
),
(
  'Mustard Greens',
  ARRAY['Sarson', 'Kadugu Keerai'],
  'vegetable',
  true,
  '🥬',
  'High in vitamins K, A, and C. Contains antioxidants.',
  'low'
),
(
  'Fenugreek Leaves',
  ARRAY['Methi', 'Vendhaya Keerai'],
  'herb',
  true,
  '🌿',
  'Known to help lower blood sugar levels. Rich in fiber and iron.',
  'low'
),
(
  'Indian Eggplant',
  ARRAY['Baingan', 'Brinjal', 'Kathirikkai'],
  'vegetable',
  true,
  '🍆',
  'Low in calories, good source of fiber and antioxidants.',
  'low'
),
(
  'Drumsticks',
  ARRAY['Moringa', 'Murungakkai'],
  'vegetable',
  true,
  '🥒',
  'Nutrient-dense superfood. Rich in vitamins, minerals, and antioxidants.',
  'low'
),
(
  'Cluster Beans',
  ARRAY['Guar', 'Kothavarangai'],
  'vegetable',
  true,
  '🫘',
  'High in fiber and protein. Good for diabetes management.',
  'low'
),
(
  'Taro Root',
  ARRAY['Arbi', 'Colocasia', 'Seppankizhangu'],
  'vegetable',
  true,
  '🥔',
  'Good source of fiber and resistant starch. Moderate glycemic index.',
  'medium'
),
-- Herbs and Aromatics
(
  'Fresh Coriander',
  ARRAY['Cilantro', 'Dhania', 'Kothamalli'],
  'herb',
  true,
  '🌿',
  'Rich in antioxidants, aids digestion. Essential in Indian cooking.',
  'low'
),
(
  'Curry Leaves',
  ARRAY['Kadi Patta', 'Kariveppilai'],
  'herb',
  true,
  '🍃',
  'Contains compounds that help regulate blood sugar. Rich in antioxidants.',
  'low'
),
(
  'Fresh Turmeric',
  ARRAY['Haldi', 'Manjal'],
  'spice',
  true,
  '🟡',
  'Powerful anti-inflammatory properties. Contains curcumin which aids blood sugar control.',
  'low'
),
(
  'Ginger',
  ARRAY['Adrak', 'Inji'],
  'spice',
  true,
  '🫚',
  'Anti-inflammatory, aids digestion. May help improve insulin sensitivity.',
  'low'
),
(
  'Garlic',
  ARRAY['Lehsun', 'Poondu'],
  'spice',
  true,
  '🧄',
  'May help lower blood sugar and cholesterol. Rich in antioxidants.',
  'low'
),
(
  'Green Chilies',
  ARRAY['Hari Mirch', 'Pacha Milagai'],
  'spice',
  true,
  '🌶️',
  'Contains capsaicin which may boost metabolism. Rich in vitamin C.',
  'low'
),
(
  'Fresh Coconut',
  ARRAY['Nariyal', 'Thengai'],
  'fruit',
  true,
  '🥥',
  'Good source of healthy fats. Moderate in calories, use in moderation.',
  'low'
),
-- Common vegetables also used in Indian cooking
(
  'Roma Tomatoes',
  ARRAY['Tamatar', 'Thakkali'],
  'vegetable',
  false,
  '🍅',
  'Low in calories, rich in lycopene and vitamin C.',
  'low'
),
(
  'Red Onions',
  ARRAY['Pyaz', 'Vengayam'],
  'vegetable',
  false,
  '🧅',
  'Contains quercetin which may help regulate blood sugar.',
  'low'
),
(
  'Cauliflower',
  ARRAY['Gobi', 'Cauliflower'],
  'vegetable',
  false,
  '🥦',
  'Low in calories, high in fiber and vitamin C.',
  'low'
),
(
  'Green Beans',
  ARRAY['French Beans', 'Beans'],
  'vegetable',
  false,
  '🫛',
  'Good source of fiber and protein. Low glycemic index.',
  'low'
),
(
  'Cabbage',
  ARRAY['Patta Gobi', 'Muttaikose'],
  'vegetable',
  false,
  '🥬',
  'Low in calories, high in fiber and vitamin C.',
  'low'
),
(
  'Carrots',
  ARRAY['Gajar', 'Carrot'],
  'vegetable',
  false,
  '🥕',
  'Rich in beta-carotene. Moderate glycemic index when cooked.',
  'medium'
),
(
  'Potatoes',
  ARRAY['Aloo', 'Urulaikizhangu'],
  'vegetable',
  false,
  '🥔',
  'High in starch. Use in moderation for diabetes management.',
  'high'
),
-- Fruits
(
  'Raw Banana',
  ARRAY['Green Banana', 'Plantain', 'Vazhakkai'],
  'fruit',
  true,
  '🍌',
  'Good source of resistant starch when unripe. Moderate glycemic index.',
  'medium'
);

-- Add comment
COMMENT ON TABLE produce_items IS 'Seeded with Indian staple vegetables, herbs, and spices common in Logan markets';
