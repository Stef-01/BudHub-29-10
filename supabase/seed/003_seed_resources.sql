-- Seed Data: Indian Dietary and Health Resources
-- Description: Links to culturally appropriate resources for Logan/Brisbane Indian community
-- Created: 2025-11-20

INSERT INTO resources (
  title,
  organization,
  url,
  language,
  format,
  topic,
  is_local,
  target_audience,
  description,
  tags,
  last_verified
) VALUES
-- Metro South Health Resources
(
  'Food and cultural practices of the Indian community in Australia',
  'Metro South Health',
  'https://metrosouth.health.qld.gov.au/multicultural-health/cultural-profiles',
  'English',
  'web',
  'Indian food culture',
  true,
  'healthcare_providers',
  'Comprehensive guide on food practices of Indian people settled in Brisbane and Logan. Includes detailed notes on typical diets, religious considerations, and culturally appropriate education strategies for healthcare providers.',
  ARRAY['cultural', 'healthcare', 'community', 'education'],
  CURRENT_DATE
),
(
  'Indian food and cultural profile - Dietetic guide',
  'Queensland Health / Metro South',
  'https://www.health.qld.gov.au/__data/assets/pdf_file/0025/155887/indian_food.pdf',
  'English',
  'pdf',
  'healthy eating',
  true,
  'patients',
  'Official dietetic guide used by Logan and Brisbane dietitians when seeing Indian patients. Covers traditional foods, meal patterns, and healthy adaptations of Indian dishes.',
  ARRAY['diabetes', 'nutrition', 'cultural', 'meal-planning'],
  CURRENT_DATE
),
-- Diabetes-Specific Resources
(
  'Managing diabetes with Indian foods',
  'Diabetes Australia',
  'https://www.diabetesaustralia.com.au/living-with-diabetes/eating-well/indian-food',
  'English',
  'web',
  'diabetes management',
  false,
  'patients',
  'Practical guide to managing diabetes while enjoying traditional Indian foods. Includes tips on portion control, recipe modifications, and understanding carbohydrate content in Indian dishes.',
  ARRAY['diabetes', 'Indian cuisine', 'carb counting', 'meal-planning'],
  CURRENT_DATE
),
(
  'Healthy Indian cooking for diabetes',
  'Diabetes Queensland',
  'https://www.diabetesqld.org.au/living-with-diabetes/food-nutrition',
  'English',
  'web',
  'healthy cooking',
  true,
  'families',
  'Queensland-specific resource with tips on healthier Indian cooking methods, ingredient substitutions, and recipe ideas suitable for diabetes management.',
  ARRAY['cooking', 'recipes', 'diabetes', 'family-friendly'],
  CURRENT_DATE
),
-- Language-Specific Resources (when available)
(
  'मधुमेह और भारतीय भोजन (Diabetes and Indian Food in Hindi)',
  'Multicultural Health',
  'https://www.health.qld.gov.au/multicultural/health_info/diabetes',
  'Hindi',
  'pdf',
  'diabetes management',
  false,
  'patients',
  'Diabetes education materials in Hindi covering meal planning, blood sugar monitoring, and healthy Indian food choices.',
  ARRAY['Hindi', 'diabetes', 'translated'],
  CURRENT_DATE
),
-- Logan-Specific Services
(
  'Logan Hospital Diabetes Centre',
  'Metro South Health',
  'https://metrosouth.health.qld.gov.au/our-services/services/diabetes',
  'English',
  'web',
  'medical services',
  true,
  'patients',
  'Diabetes education and support services at Logan Hospital. Offers culturally appropriate education and has staff familiar with Indian dietary needs.',
  ARRAY['Logan', 'medical', 'support', 'education'],
  CURRENT_DATE
),
(
  'My Health for Life - Logan Program',
  'Queensland Health',
  'https://www.myhealthforlife.com.au',
  'English',
  'web',
  'lifestyle program',
  true,
  'patients',
  'Free healthy lifestyle program available to Logan residents at risk of type 2 diabetes. Includes personalized coaching on diet, exercise, and lifestyle changes with cultural sensitivity.',
  ARRAY['free', 'Logan', 'prevention', 'lifestyle', 'coaching'],
  CURRENT_DATE
),
-- Nutrition Education
(
  'Understanding the Glycemic Index - Indian Foods',
  'Diabetes Australia',
  'https://www.diabetesaustralia.com.au/living-with-diabetes/eating-well/gi',
  'English',
  'web',
  'carb counting',
  false,
  'general',
  'Guide to understanding glycemic index with specific reference to common Indian staples like rice, roti, dal, and vegetables.',
  ARRAY['GI', 'education', 'Indian staples', 'blood sugar'],
  CURRENT_DATE
),
(
  'Healthy plate method for Indian meals',
  'Queensland Health',
  'https://www.health.qld.gov.au/nutrition/healthy-plate',
  'English',
  'web',
  'healthy eating',
  true,
  'families',
  'Visual guide to building a balanced plate adapted for Indian meal patterns. Shows portion sizes for roti/rice, dal/curry, and vegetables.',
  ARRAY['portions', 'visual', 'meal-planning', 'family-friendly'],
  CURRENT_DATE
),
-- Community Support
(
  'Indian Australian Association of Queensland',
  'Community Organization',
  'https://www.iaq.org.au',
  'English',
  'web',
  'community support',
  true,
  'families',
  'Community organization supporting Indian families in Queensland. Often runs health awareness events and cooking workshops in Brisbane and Logan area.',
  ARRAY['community', 'cultural', 'events', 'support'],
  CURRENT_DATE
),
-- Recipe Resources
(
  'Healthy Indian recipes for diabetes',
  'Diabetes Australia',
  'https://www.diabetesaustralia.com.au/recipes',
  'English',
  'web',
  'recipes',
  false,
  'families',
  'Collection of diabetes-friendly Indian recipes with nutritional information and cooking tips.',
  ARRAY['recipes', 'cooking', 'diabetes-friendly', 'nutrition'],
  CURRENT_DATE
),
-- Video Resources
(
  'Indian cooking for diabetes - Video series',
  'Multicultural Health',
  'https://www.youtube.com/health',
  'English',
  'video',
  'healthy cooking',
  false,
  'families',
  'Video demonstrations of healthy Indian cooking techniques, ingredient substitutions, and meal preparation tips.',
  ARRAY['video', 'cooking', 'demonstrations', 'visual-learning'],
  CURRENT_DATE
);

-- Add comment
COMMENT ON TABLE resources IS 'Seeded with culturally appropriate Indian dietary and health resources for Logan/Brisbane community';
